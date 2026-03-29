import type { IpcHandle } from "#main/lib/ipc";
import type { BrowserWindow } from "electron";
import { app, ipcMain, shell } from "electron";
import fs from "node:fs";
import path from "node:path";

export class Printer {}

export interface IPC {
  "print/pdf": {
    args: [];
    return: string;
  };
  "print/slient": {
    args: [];
    return: boolean;
  };
}

export const ipcHandles = (win: BrowserWindow, ipcHandle: IpcHandle) => {
  ipcHandle("print/pdf", async () => {
    const result = await win.webContents.printToPDF({
      margins: { marginType: "none" },
      pageSize: "A4",
      landscape: false,
      displayHeaderFooter: false,
      printBackground: false,
      scale: 1,
      pageRanges: "",
      headerTemplate: void 0,
      footerTemplate: void 0,
      preferCSSPageSize: false,
    });

    const filePath = path.resolve(app.getPath("temp"), "preview.pdf");
    await fs.promises.writeFile(filePath, result);
    await shell.openPath(filePath);
    return filePath;
  });
  ipcHandle("print/slient", async () => {
    const result = await new Promise<boolean>((resolve, reject) => {
      win.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: void 0,
          color: false,
          margins: { marginType: "none" },
          landscape: false,
          scaleFactor: 1,
          pagesPerSheet: 1,
          collate: true,
          copies: 1,
          pageRanges: void 0,
          duplexMode: void 0,
          dpi: void 0,
          header: void 0,
          footer: void 0,
        },
        (success, failureReason) => {
          if (success) {
            resolve(true);
          } else {
            reject(failureReason);
          }
        },
      );
    });

    return result;
  });

  return () => {
    ipcMain.removeHandler("print/pdf");
    ipcMain.removeHandler("print/slient");
  };
};
