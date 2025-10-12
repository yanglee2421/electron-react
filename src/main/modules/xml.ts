import { getTempDir, ipcHandle } from "#main/lib";
import { channel } from "#main/channel";
import { Poppler } from "node-poppler";
import { XMLParser } from "fast-xml-parser";
import { readBarcodes, prepareZXingModule } from "zxing-wasm";
import loaderWASM from "#resources/zxing_full.wasm?loader";
import * as path from "node:path";
import { readFile, rm, stat, readdir } from "node:fs/promises";

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

const ls = async (basePath: string, set: Set<string>) => {
  const basePathStat = await stat(basePath);
  const isFile = basePathStat.isFile();
  const isDirectory = basePathStat.isDirectory();

  if (isFile) {
    set.add(basePath);
  }

  if (isDirectory) {
    const basenames = await readdir(basePath);

    for (const basename of basenames) {
      const fullPath = path.resolve(basePath, basename);
      await ls(fullPath, set);
    }
  }
};

const xmlPathToJSONData = async (xmlPath: string) => {
  const xmlText = await readFile(xmlPath, "utf-8");
  const xmlParser = new XMLParser();
  const jsonObj = xmlParser.parse(xmlText);

  return jsonObj;
};

const pdfPathToJSONData = async (pdfPath: string) => {
  const poppler = new Poppler();
  const tempPng = path.resolve(getTempDir(), `${Date.now()}`);
  await poppler.pdfToCairo(pdfPath, tempPng, {
    pngFile: true,
    singleFile: true,

    // Set DPI in both X and Y directions to twice the default (default is 150)
    resolutionXYAxis: 300,
  });

  const pngPath = `${tempPng}.png`;
  const pngBuf = await readFile(pngPath);
  const barcode = await readBarcodes(pngBuf);
  await rm(pngPath);

  return barcode;
};

const collectAllFilePaths = async (paths: string[]) => {
  const set = new Set<string>();

  for (const p of paths) {
    await ls(p, set);
  }

  return set;
};

const collectXMLResult = async (filePath: string, result: Set<unknown>) => {
  const data = await xmlPathToJSONData(filePath);
  result.add(data);
};

const collectPDFResult = async (filePath: string, result: Set<unknown>) => {
  const data = await pdfPathToJSONData(filePath);
  result.add(data);
};

export const bindIpcHandler = () => {
  ipcHandle(channel.XML, async (_, payload: string) => {
    const xmlPath = payload;
    const data = await xmlPathToJSONData(xmlPath);
    return data;
  });
  ipcHandle(channel.LAB, async (_, payload: string[]) => {
    const filePaths = await collectAllFilePaths(payload);
    const result = new Set<unknown>();

    for (const filePath of filePaths) {
      const extname = path.extname(filePath).toLowerCase();

      switch (extname) {
        case ".xml":
          await collectXMLResult(filePath, result);
          break;
        case ".pdf":
          await collectPDFResult(filePath, result);
          break;
        default:
          throw new Error(`不支持的文件类型: ${extname}`);
      }
    }

    return Array.from(result);
  });
};
