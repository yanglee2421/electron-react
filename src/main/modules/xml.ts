import * as fs from "node:fs";
import * as path from "node:path";
import { PDFParse } from "pdf-parse";
import { XMLParser } from "fast-xml-parser";
import { getWorkerPath } from "pdf-parse/worker";
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

const getItemName = (
  issuItemInformation: IssuItemInformation | IssuItemInformation[],
) => {
  const originItemName = Array.isArray(issuItemInformation)
    ? issuItemInformation.at(0)?.ItemName
    : issuItemInformation.ItemName;

  const regex = /\*(?<content>.+?)\*/;

  return originItemName?.match(regex)?.groups?.content || "运输服务";
};

const xmlPathToInvoice = async (xmlPath: string) => {
  const jsonData = await xmlPathToJSONData(xmlPath);
  const id = jsonData.EInvoice.Header.EIid;
  const totalTaxIncludedAmount =
    "" +
    jsonData.EInvoice.EInvoiceData.BasicInformation["TotalTax-includedAmount"];
  const requestTime =
    jsonData.EInvoice.EInvoiceData.BasicInformation.RequestTime;
  const IssuItemInformation =
    jsonData.EInvoice.EInvoiceData.IssuItemInformation;

  const result: Invoice = {
    id,
    totalTaxIncludedAmount,
    requestTime,
    itemName: getItemName(IssuItemInformation),
    additionalInformation:
      typeof jsonData.EInvoice.EInvoiceData.AdditionalInformation === "string"
        ? jsonData.EInvoice.EInvoiceData.AdditionalInformation
        : jsonData.EInvoice.EInvoiceData.AdditionalInformation.Remark,
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
        const id = tuple.at(3) || "";
        const totalTaxIncludedAmount = tuple.at(4) || "";
        const requestTime = tuple.at(5) || "";

        if (!id) continue;
        if (!requestTime) continue;
        if (!totalTaxIncludedAmount) continue;

        rows.push({
          id,
          totalTaxIncludedAmount,
          requestTime,
          itemName: "运输服务",
          additionalInformation: "尚不支持从PDF中提取备注",
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

const mapGroupBy = <TElement, TKey>(
  array: TElement[],
  getGroupKey: (element: TElement, index: number) => TKey,
) => {
  const groupMap = new Map<TKey, TElement[]>();

  array.reduce((groupMap, element, index) => {
    const groupKey = getGroupKey(element, index);
    const group = groupMap.get(groupKey);

    if (Array.isArray(group)) {
      group.push(element);
    } else {
      groupMap.set(groupKey, [element]);
    }

    return groupMap;
  }, groupMap);

  return groupMap;
};

export const bindIpcHandler = () => {
  ipcHandle(channel.XML, async (_, payload: string) => {
    const xmlPath = payload;
    const data = await xmlPathToJSONData(xmlPath);
    return data;
  });

  /**
   * @param filePath A array includes filePath & directory
   * @returns All .pdf & .xml
   */
  ipcHandle(
    channel.SELECT_XML_PDF_FROM_FOLDER,
    async (_, filePaths: string[]) => {
      const allFilePaths = await collectAllFilePaths(filePaths);
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
    },
  );
  ipcHandle(channel.XML_PDF_COMPUTE, async (_, filePaths: string[]) => {
    const resultMap = new Map<string, Invoice>();
    const fileGroup = mapGroupBy(filePaths, (filePath) =>
      path.extname(filePath),
    );
    const pdfGroup = fileGroup.get(".pdf") || [];
    const xmlGroup = fileGroup.get(".xml") || [];

    for (const pdf of pdfGroup) {
      await collectPDFResult(pdf, resultMap);
    }

    for (const xml of xmlGroup) {
      await collectXMLResult(xml, resultMap);
    }

    return [...resultMap.values()];
  });
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
      AdditionalInformation:
        | string
        | {
            Remark: string;
          };
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

export type Invoice = {
  id: string;
  totalTaxIncludedAmount: string;
  requestTime: string;
  itemName?: string;
  additionalInformation?: string;
};
