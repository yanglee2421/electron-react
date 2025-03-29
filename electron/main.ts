import { app, BrowserWindow, ipcMain, shell, nativeTheme } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
// import { createRequire } from "node:module";
import * as channel from "./channel";
import {
  getCpuSerial,
  getMotherboardSerial,
  runWinword,
  execFileAsync,
  getDataFromAccessDatabase,
  getIP,
  getCorporation,
  withLog,
} from "./lib";
import dayjs from "dayjs";
import * as consts from "@/lib/constants";
import * as hxzyHmis from "./hxzy_hmis";
import type { GetDataFromAccessDatabaseParams } from "@/api/database_types";
import type { AutoInputToVCParams } from "@/api/autoInput_types";

// const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },

    autoHideMenuBar: false,
    // alwaysOnTop: true,

    width: 1024,
    height: 768,
    // show: false,
  });

  win.menuBarVisible = false;

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    console.log("did-finish-load");
  });
  win.on("focus", () => {
    win?.webContents.send(channel.windowFocus);
  });
  win.on("blur", () => {
    win?.webContents.send(channel.windowBlur);
  });
  win.on("show", () => {
    // Only fire when the win.show is called on Windows
    win?.webContents.send(channel.windowShow);
  });
  win.on("hide", () => {
    // Only fire when the win.hide is called on Windows
    win?.webContents.send(channel.windowHide);
  });
  win.once("ready-to-show", () => {
    // Too late to call win.show() here
    // win?.show();
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(async () => {
  createWindow();
});

ipcMain.handle(
  channel.openDevTools,
  withLog(async () => {
    if (!win) return;
    win.webContents.openDevTools();
  })
);

ipcMain.handle(
  channel.openPath,
  withLog(async (e, path: string) => {
    // Prevent unused variable error
    void e;
    const data = await shell.openPath(path);
    return data;
  })
);

ipcMain.handle(
  channel.getCpuSerial,
  withLog(async () => {
    // Ensure an error is thrown when the promise is rejected
    return await getCpuSerial();
  })
);

ipcMain.handle(
  channel.getMotherboardSerial,
  withLog(async () => {
    // Ensure an error is thrown when the promise is rejected
    return await getMotherboardSerial();
  })
);

ipcMain.handle(
  channel.hxzy_hmis_get_data,
  withLog(async (e, params: hxzyHmis.GetRequest) => {
    // Prevent unused variable warning
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await hxzyHmis.getFn(params);
  })
);

ipcMain.handle(
  channel.hxzy_hmis_save_data,
  withLog(async (e, params: hxzyHmis.SaveDataParams) => {
    // Prevent unused variable warning
    void e;
    const startDate = dayjs().startOf("day").format(consts.DATE_FORMAT);
    const endDate = dayjs().endOf("day").format(consts.DATE_FORMAT);
    const eq_ip = getIP();
    const corporation = await getCorporation({
      driverPath: params.driverPath,
      databasePath: params.databasePath,
    });

    const settledData = await Promise.allSettled(
      params.records.map((record) =>
        hxzyHmis.recordToSaveDataParams(
          record,
          eq_ip,
          corporation.DeviceNO || "",
          startDate,
          endDate,
          params.driverPath,
          params.databasePath
        )
      )
    );

    const data = settledData
      .filter((i) => i.status === "fulfilled")
      .map((i) => i.value);

    const dhs = data.map((i) => i.dh);

    if (!data.length) {
      throw `轴号[${params.records
        .map((record) => record.zh)
        .join(",")}],均未找到对应的记录`;
    }

    const result = await hxzyHmis.postFn({
      data,
      host: params.host,
    });

    return { result, dhs };
  })
);

ipcMain.handle(
  channel.hxzy_hmis_upload_verifies,
  withLog(async (e, params: hxzyHmis.UploadVerifiesParams) => {
    // Prevent unused variable warning
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await hxzyHmis.idToUploadVerifiesData(
      params.id,
      params.driverPath,
      params.databasePath
    );
  })
);

ipcMain.handle(
  channel.autoInputToVC,
  withLog(async (e, data: AutoInputToVCParams) => {
    // Prevent unused variable warning
    void e;
    const cp = await execFileAsync(data.driverPath, [
      "autoInputToVC",
      data.zx,
      data.zh,
      data.czzzdw,
      data.sczzdw,
      data.mczzdw,
      data.czzzrq,
      data.sczzrq,
      data.mczzrq,
      data.ztx,
      data.ytx,
    ]);

    if (cp.stderr) {
      throw cp.stderr;
    }

    return cp.stdout;
  })
);

ipcMain.handle(
  channel.printer,
  withLog(async (e, data: string) => {
    // Prevent unused variable warning
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await runWinword(data).catch(() => shell.openPath(data));
  })
);

ipcMain.handle(
  channel.getDataFromAccessDatabase,
  withLog(async (e, params: GetDataFromAccessDatabaseParams) => {
    // Prevent unused variable warning
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await getDataFromAccessDatabase({
      driverPath: params.driverPath,
      databasePath: params.databasePath,
      sql: params.query,
    });
  })
);

ipcMain.handle(
  channel.mem,
  withLog(async () => {
    const processMemoryInfo = await process.getProcessMemoryInfo();
    const freemem = processMemoryInfo.residentSet;

    return {
      totalmem: process.getSystemMemoryInfo().total,
      freemem,
    };
  })
);

ipcMain.handle(
  channel.toggleMode,
  withLog(async (e, mode: "system" | "dark" | "light") => {
    // Prevent unused variable warning
    void e;
    nativeTheme.themeSource = mode;
  })
);

ipcMain.handle(
  channel.setAlwaysOnTop,
  withLog(async (e, alwaysOnTop: boolean) => {
    // Prevent unused variable warning
    void e;
    win?.setAlwaysOnTop(alwaysOnTop);
  })
);
