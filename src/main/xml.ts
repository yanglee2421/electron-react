import { channel } from "./channel";
import { ipcHandle } from "./lib";
import { XMLParser } from "fast-xml-parser";
import * as fs from "node:fs";
import * as utils from "node:util";

export const bindIpcHandler = () => {
  ipcHandle(channel.XML, async (_, payload: string) => {
    const xmlPath = payload;
    const readFile = utils.promisify(fs.readFile);
    const xmlFs = await readFile(xmlPath, "utf-8");
    const xmlParser = new XMLParser();
    const jsonObj = xmlParser.parse(xmlFs);

    return jsonObj;
  });
};
