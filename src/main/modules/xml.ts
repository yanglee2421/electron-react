import * as fs from "node:fs";
import * as path from "node:path";
// import * as mathjs from "mathjs";
import { PDFParse } from "pdf-parse";
import { XMLParser } from "fast-xml-parser";
import { getWorkerPath } from "pdf-parse/worker";
import { BrowserWindow, dialog } from "electron";
import { readBarcodes, prepareZXingModule } from "zxing-wasm";
import { channel } from "#main/channel";
import { ipcHandle, ls } from "#main/lib";
import loaderWASM from "#resources/zxing_full.wasm?loader";

PDFParse.setWorker(getWorkerPath());

prepareZXingModule({
  overrides: {
    async instantiateWasm(
      imports: WebAssembly.Imports,
      successCallback: (instance: WebAssembly.Instance) => void,
    ) {
      const instance = await loaderWASM(imports);
      successCallback(instance);
      return {};
    },
  },
});

const xmlPathToJSONData = async (xmlPath: string) => {
  const xmlText = await fs.promises.readFile(xmlPath, "utf-8");
  const xmlParser = new XMLParser();
  const jsonData: XMLJSONData = xmlParser.parse(xmlText);
  return jsonData;
};

const xmlPathToInvoice = async (xmlPath: string) => {
  const jsonData = await xmlPathToJSONData(xmlPath);
  const IssuItemInformation =
    jsonData.EInvoice.EInvoiceData.IssuItemInformation;
  const result: Invoice = {
    id: jsonData.EInvoice.Header.EIid,
    totalTaxIncludedAmount:
      "" +
      jsonData.EInvoice.EInvoiceData.BasicInformation[
        "TotalTax-includedAmount"
      ],
    requestTime: jsonData.EInvoice.EInvoiceData.BasicInformation.RequestTime,
    itemName: Array.isArray(IssuItemInformation)
      ? IssuItemInformation.at(0)?.ItemName
      : IssuItemInformation.ItemName,
    additionalInformation: jsonData.EInvoice.EInvoiceData.AdditionalInformation,
  };

  return result;
};

const pdfPathToInvoices = async (pdfPath: string) => {
  const pdfBuffer = await fs.promises.readFile(pdfPath);
  const pdfParse = new PDFParse({ data: pdfBuffer });
  const imageResult = await pdfParse.getImage();
  await pdfParse.destroy();

  const rows: Invoice[] = [];

  for (const pageData of imageResult.pages) {
    for (const image of pageData.images) {
      const results = await readBarcodes(image.data);
      for (const result of results) {
        const tuple = result.text.split(",");
        rows.push({
          id: tuple.at(3) || "",
          totalTaxIncludedAmount: tuple.at(4) || "",
          requestTime: tuple.at(5) || "",
        });
      }
    }
  }

  return rows;
};

const collectAllFilePaths = async (paths: string[]) => {
  const set = new Set<string>();

  for (const p of paths) {
    await ls(p, set);
  }

  return set;
};

const collectXMLResult = async (
  filePath: string,
  result: Map<string, Invoice>,
) => {
  const data = await xmlPathToInvoice(filePath);
  result.set(data.id, data);
};

const collectPDFResult = async (
  filePath: string,
  result: Map<string, Invoice>,
) => {
  const datas = await pdfPathToInvoices(filePath);

  for (const data of datas) {
    result.set(data.id, data);
  }
};

export const bindIpcHandler = () => {
  ipcHandle(channel.XML, async (_, payload: string) => {
    const xmlPath = payload;
    const data = await xmlPathToJSONData(xmlPath);
    return data;
  });
  // ipcHandle(channel.LAB, async (_, payload: string) => {
  //   const result = await pdfPathToJSONData(payload);
  //   return result;
  // });
  ipcHandle(channel.SELECT_XML_PDF_FROM_FOLDER, async () => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) throw new Error("No BrowserWindow exist");
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    const allFilePaths = await collectAllFilePaths(result.filePaths);
    const fileteredFilePaths = [...allFilePaths].filter((filePath) => {
      const extname = path.extname(filePath);
      switch (extname) {
        case ".pdf":
        case ".xml":
          return true;
        default:
          return false;
      }
    });
    return fileteredFilePaths;
  });
  ipcHandle("xxxxxx", async (_, payload: Payload) => {
    const { paths } = payload;
    // const map = new Map(idToDenominator);
    const resultMap = new Map<string, Invoice>();

    const group = {
      pdf: [] as string[],
      xml: [] as string[],
    };

    paths.reduce((group, filePath) => {
      const extname = path.extname(filePath);
      switch (extname) {
        case ".pdf":
          group.pdf.push(filePath);
          break;
        case ".xml":
          group.xml.push(filePath);
          break;
      }
      return group;
    }, group);

    for (const pdf of group.pdf) {
      await collectPDFResult(pdf, resultMap);
    }

    for (const xml of group.xml) {
      await collectXMLResult(xml, resultMap);
    }

    return {
      rows: [],
      result: "0.00",
    };
  });
};

type Payload = {
  paths: string[];
  idToDenominator: [string, number][];
};

type IssuItemInformation = {
  ItemName: string;
  SpecMod: string;
  MeaUnits: string;
  Quantity: number;
  UnPrice: number;
  Amount: number;
  TaxRate: number;
  ComTaxAm: number;
  TotaltaxIncludedAmount: number;
  TaxClassificationCode: string | number;
};

type XMLJSONData = {
  "?xml": string;
  EInvoice: {
    Header: {
      EIid: string;
      EInvoiceTag: string;
      Version: number;
      InherentLabel: {
        InIssuType: {
          LabelCode: string;
          LabelName: string;
        };
        EInvoiceType: {
          LabelCode: number | string;
          LabelName: string;
        };
        GeneralOrSpecialVAT: {
          LabelCode: number | string;
          LabelName: string;
        };
      };
      UndefinedLabel: {
        Label: {
          LabelType: string;
          LabelCode: number | string;
          LabelName: string;
        };
      };
    };
    EInvoiceData: {
      SellerInformation: {
        SellerIdNum: string;
        SellerName: string;
        SellerAddr: string;
        SellerTelNum: string;
        SellerBankName: string;
        SellerBankAccNum: string | number;
      };
      BuyerInformation: {
        BuyerIdNum: string;
        BuyerName: string;
        BuyerBankName: string;
        BuyerBankAccNum: string | number;
        BuyerAddr: string;
        BuyerTelNum: string;
      };
      BasicInformation: {
        TotalAmWithoutTax: number;
        TotalTaxAm: number;
        "TotalTax-includedAmount": number;
        "TotalTax-includedAmountInChinese": string;
        Drawer: string;
        RequestTime: string;
      };
      IssuItemInformation: IssuItemInformation[] | IssuItemInformation;
      SpecificInformation: {
        PassengerTransportation: Array<{
          Departure: string;
          Destination: string;
          Traveler: string;
          ValidIDNumber: string;
          TravelDate: string;
          Grade: string;
          TypeOfPassengerDocument: string;
          Vehicletype: string;
        }>;
      };
      AdditionalInformation: string;
    };
    SellerAuthentication: {
      AuthenticationMethods: number | string;
    };
    TaxSupervisionInfo: {
      InvoiceNumber: string;
      IssueTime: string;
      TaxBureauCode: string | number;
      TaxBureauName: string;
    };
  };
};

type Invoice = {
  id: string;
  totalTaxIncludedAmount: string;
  requestTime: string;
  itemName?: string;
  additionalInformation?: string;
};
