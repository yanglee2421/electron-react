import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import { mapGroupBy } from "@yotulee/run";
import path from "node:path";
import type { Invoice } from "./types";
import {
  collectAllFilePaths,
  collectPDFResult,
  collectXMLResult,
  xmlPathToJSONData,
} from "./xml";

export const registerIPCHandlers = () => {
  ipcHandle("XML/XML", async (_, payload: string) => {
    const xmlPath = payload;
    const data = await xmlPathToJSONData(xmlPath);
    return data;
  });

  ipcHandle(
    "XML/SELECT_XML_PDF_FROM_FOLDER",
    async (_, filePaths: string[]) => {
      const allFilePaths = await collectAllFilePaths(filePaths);
      console.log("allFilePaths", allFilePaths);
      const fileteredFilePaths = [...allFilePaths].filter((filePath) => {
        const extname = path.extname(filePath).toLowerCase();
        switch (extname) {
          case ".pdf":
          case ".xml":
            return true;
          default:
            return false;
        }
      });
      console.log("fileteredFilePaths", fileteredFilePaths);
      return fileteredFilePaths;
    },
  );
  ipcHandle("XML/XML_PDF_COMPUTE", async (_, filePaths: string[]) => {
    const resultMap = new Map<string, Invoice>();
    const fileGroup = mapGroupBy(filePaths, (filePath) =>
      path.extname(filePath).toLowerCase(),
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

  return () => {
    ipcRemoveHandle("XML/XML");
    ipcRemoveHandle("XML/SELECT_XML_PDF_FROM_FOLDER");
    ipcRemoveHandle("XML/XML_PDF_COMPUTE");
  };
};
