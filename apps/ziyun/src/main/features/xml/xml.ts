import { ls } from "#main/lib/fs";
import loaderWASM from "#resources/zxing_full.wasm?loader";
import { XMLParser } from "fast-xml-parser";
import fs from "node:fs";
import { PDFParse } from "pdf-parse";
import { getPath } from "pdf-parse/worker";
import { prepareZXingModule, readBarcodes } from "zxing-wasm";
import type { Invoice, IssuItemInformation, XMLJSONData } from "./types";

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

export const xmlPathToJSONData = async (xmlPath: string) => {
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

export const collectAllFilePaths = async (paths: string[]) => {
  let result: string[] = [];

  for (const path of paths) {
    const subPaths = await ls(path);
    result = result.concat(subPaths);
  }

  return result;
};

export const collectXMLResult = async (
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

export const collectPDFResult = async (
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
