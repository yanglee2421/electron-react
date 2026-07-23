import { Jimp, JimpMime } from "jimp";
import fs from "node:fs";
import path from "node:path";

export interface ChannelImage {
  lct: string;
  rct: string;
  llz: string;
  rlz: string;
  lxh: string;
  rxh: string;
}

const bmpToJpeg = async (bmpPath: string, jpegPath: string) => {
  const image = await Jimp.read(bmpPath);
  const buffer = await image.getBuffer(JimpMime.jpeg);
  await fs.promises.writeFile(jpegPath, buffer);

  return jpegPath;
};

const bmpPathToJpegPath = (tmpPath: string, bmpPath: string) => {
  const filename = path.basename(bmpPath, path.extname(bmpPath));
  return path.resolve(tmpPath, `${filename}.jpg`);
};

interface ConvertBmpToJpegInput extends ChannelImage {
  tmpPath: string;
}

export const convertBmpToJpeg = async (bmps: ConvertBmpToJpegInput) => {
  const jpegs: ChannelImage = {
    lct: "",
    rct: "",
    llz: "",
    rlz: "",
    lxh: "",
    rxh: "",
  };

  jpegs.lct = bmpPathToJpegPath(bmps.tmpPath, bmps.lct);
  jpegs.rct = bmpPathToJpegPath(bmps.tmpPath, bmps.rct);
  jpegs.llz = bmpPathToJpegPath(bmps.tmpPath, bmps.llz);
  jpegs.rlz = bmpPathToJpegPath(bmps.tmpPath, bmps.rlz);
  jpegs.lxh = bmpPathToJpegPath(bmps.tmpPath, bmps.lxh);
  jpegs.rxh = bmpPathToJpegPath(bmps.tmpPath, bmps.rxh);

  await Promise.allSettled([
    bmpToJpeg(bmps.lct, jpegs.lct),
    bmpToJpeg(bmps.rct, jpegs.rct),
    bmpToJpeg(bmps.llz, jpegs.llz),
    bmpToJpeg(bmps.rlz, jpegs.rlz),
    bmpToJpeg(bmps.lxh, jpegs.lxh),
    bmpToJpeg(bmps.rxh, jpegs.rxh),
  ]);

  return jpegs;
};

export default convertBmpToJpeg;