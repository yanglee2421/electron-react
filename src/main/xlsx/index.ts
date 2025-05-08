import { ipcMain } from "electron/main";
import { withLog } from "#/lib";
import * as channel from "#/channel";
import { chr_502 } from "./chr_502";
import { chr_53a } from "./chr_53a";

/**
 * CHR53A Work Records
 * CHR501 Dayly Validate
 * CHR502 Quartor Validate
 * CHR503 Yearly Validate
 */
export const initIpc = () => {
  ipcMain.handle(channel.excel_quartor, withLog(chr_502));
  ipcMain.handle(channel.excel_detection, withLog(chr_53a));
};
