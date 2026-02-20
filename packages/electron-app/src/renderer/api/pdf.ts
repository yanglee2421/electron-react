import { queryOptions } from "@tanstack/react-query";
import { readBarcodes, prepareZXingModule } from "zxing-wasm/reader";
import wasmURL from "zxing-wasm/reader/zxing_reader.wasm?url";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import * as pdfjs from "pdfjs-dist";

const getWASMHref = () => new URL(wasmURL, import.meta.url).href;
const getPDFWorkerHref = () => new URL(pdfWorker, import.meta.url).href;

export const prepareModule = () => {
  pdfjs.GlobalWorkerOptions.workerSrc = getPDFWorkerHref();

  prepareZXingModule({
    overrides: {
      locateFile(path: string, prefix: string) {
        if (path.endsWith(".wasm")) {
          return getWASMHref();
        }
        return prefix + path;
      },
    },
  });
};

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error("get blob from canvas failed");
      }
      resolve(blob);
    });
  });

export const pdfToImageBlob = async (file: File, pageIndex = 1) => {
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const page = await doc.getPage(pageIndex);
  const viewport = page.getViewport({ scale: 2 });
  const outputScale = window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw new Error("get canvas context failed");

  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);

  await page.render({
    viewport,
    canvas,
    canvasContext,
    transform: Object.is(outputScale, 1)
      ? void 0
      : [outputScale, 0, 0, outputScale, 0, 0],
  }).promise;

  const blob = await canvasToBlob(canvas);

  return blob;
};

export const fetchBarcodeTextFromPDF = (file: File) =>
  queryOptions({
    queryKey: [
      "pdf demo",
      [file.lastModified, file.name, file.size, file.type],
    ],
    async queryFn() {
      const blob = await pdfToImageBlob(file);
      const barcodes = await readBarcodes(blob);
      return barcodes.map((i) => i.text);
    },
  });

export const fetchBarcodeTextFromImage = (file: File) =>
  queryOptions({
    queryKey: [
      "get qrcode text from image demo",
      [file.lastModified, file.name, file.size, file.type],
    ],
    queryFn: async () => {
      const barcodes = await readBarcodes(file);
      return barcodes.map((i) => i.text);
    },
  });
