import { ipcMain } from "electron/main";
import { withLog } from "#/lib";
import * as channel from "#/channel";
import { chr_502 } from "./chr_502";
import { chr_53a } from "./chr_53a";
import { chr_501 } from "./chr_501";

/**
 * CHR53A Work Records
 * CHR501 Dayly Validate
 * CHR502 Quartor Validate
 * CHR503 Yearly Validate
 */
export const initIpc = () => {
  ipcMain.handle(channel.xlsx_chr_501, withLog(chr_501));
  ipcMain.handle(channel.xlsx_chr_502, withLog(chr_502));
  ipcMain.handle(channel.xlsx_chr_53a, withLog(chr_53a));
  ipcMain.handle(
    channel.sqlite_xlsx_size_c,
    withLog(async () => {}),
  );
  ipcMain.handle(
    channel.sqlite_xlsx_size_u,
    withLog(async () => {}),
  );
  ipcMain.handle(
    channel.sqlite_xlsx_size_r,
    withLog(async () => {}),
  );
  ipcMain.handle(
    channel.sqlite_xlsx_size_d,
    withLog(async () => {}),
  );
};
