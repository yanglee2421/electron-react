import * as fs from "node:fs";
import * as path from "node:path";
import { PDFParse } from "pdf-parse";
import { XMLParser } from "fast-xml-parser";
import { getPath } from "pdf-parse/worker";
import { readBarcodes, prepareZXingModule } from "zxing-wasm";
import { ipcHandle } from "#main/lib/ipc";
import { ls } from "#main/lib/fs";
import loaderWASM from "#resources/zxing_full.wasm?loader";
import type { AppContext } from "..";
import type { Invoice, IssuItemInformation, XMLJSONData } from "#main/lib/ipc";

PDFParse.setWorker(getPath());

prepareZXingModule({
  overrides: {
    instantiateWasm: async (
      imports: WebAssembly.Imports,
      successCallback: (instance: WebAssembly.Instance) => void,
    ) => {
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
    filePath: xmlPath,
    itemName: getItemName(IssuItemInformation),
    additionalInformation:
      typeof jsonData.EInvoice.EInvoiceData.AdditionalInformation === "string"
        ? jsonData.EInvoice.EInvoiceData.AdditionalInformation
        : jsonData.EInvoice.EInvoiceData.AdditionalInformation.Remark,
    xml: true,
    pdf: false,
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
          filePath: pdfPath,
          itemName: "运输服务",
          additionalInformation: "尚不支持从PDF中提取备注",
          pdf: true,
          xml: false,
        });
      }
    }
  }

  return rows;
};

const collectAllFilePaths = async (paths: string[]) => {
  let result: string[] = [];

  for (const path of paths) {
    const subPaths = await ls(path);
    result = result.concat(subPaths);
  }

  return result;
};

const collectXMLResult = async (
  filePath: string,
  result: Map<string, Invoice>,
) => {
  const data = await xmlPathToInvoice(filePath);
  const prev = result.get(data.id);

  if (prev) {
    result.set(data.id, { ...prev, ...data, pdf: prev.pdf });
    return;
  }

  result.set(data.id, data);
};

const collectPDFResult = async (
  filePath: string,
  result: Map<string, Invoice>,
) => {
  const datas = await pdfPathToInvoices(filePath);

  for (const data of datas) {
    const prev = result.get(data.id);

    if (prev) {
      result.set(data.id, { ...prev, ...data, xml: prev.xml });
      return;
    }

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

export const bindIpcHandlers = (appContext: AppContext) => {
  void appContext;
  ipcHandle("XML/XML", async (_, payload: string) => {
    const xmlPath = payload;
    const data = await xmlPathToJSONData(xmlPath);
    return data;
  });

  /**
   * @param filePath A array includes filePath & directory
   * @returns All .pdf & .xml
   */
  ipcHandle(
    "XML/SELECT_XML_PDF_FROM_FOLDER",
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
  ipcHandle("XML/XML_PDF_COMPUTE", async (_, filePaths: string[]) => {
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
