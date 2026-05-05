import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import { electronApp, platform } from "@electron-toolkit/utils";
import { app, BrowserWindow, dialog, shell } from "electron";

export const registerIPCHandlers = () => {
  ipcHandle("APP/OPEN_AT_LOGIN", async (_, openAtLogin?: boolean) => {
    if (platform.isLinux) {
      return false;
    }

    if (typeof openAtLogin === "boolean") {
      return electronApp.setAutoLaunch(openAtLogin);
    }

    return app.getLoginItemSettings().openAtLogin;
  });

  ipcHandle("APP/OPEN_DEV_TOOLS", async () => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) return;
    win.webContents.openDevTools();
  });

  ipcHandle("APP/OPEN_PATH", async (_, path: string) => {
    const data = await shell.openPath(path);
    return data;
  });

  ipcHandle("APP/MOBILE_MODE", async (_, mobile: boolean) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (mobile) {
        win.setSize(500, 800);
      } else {
        win.setSize(1024, 768);
      }
      win.center();
    });
    return mobile;
  });

  ipcHandle("APP/SELECT_DIRECTORY", async () => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) throw new Error("No active window");
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    return result.filePaths;
  });

  ipcHandle("APP/SELECT_FILE", async (_, filters: Electron.FileFilter[]) => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) throw new Error("No active window");
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters,
    });
    return result.filePaths;
  });

  ipcHandle(
    "APP/SHOW_OPEN_DIALOG",
    async (_, options: Electron.OpenDialogOptions) => {
      const win = BrowserWindow.getAllWindows().at(0);
      if (!win) throw new Error("No active window");
      const result = await dialog.showOpenDialog(win, options);
      return result.filePaths;
    },
  );

  return () => {
    ipcRemoveHandle("APP/OPEN_AT_LOGIN");
    ipcRemoveHandle("APP/OPEN_DEV_TOOLS");
    ipcRemoveHandle("APP/OPEN_PATH");
    ipcRemoveHandle("APP/MOBILE_MODE");
    ipcRemoveHandle("APP/SELECT_DIRECTORY");
    ipcRemoveHandle("APP/SELECT_FILE");
    ipcRemoveHandle("APP/SHOW_OPEN_DIALOG");
  };
};
