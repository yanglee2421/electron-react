import { app, BrowserWindow, ipcMain, shell } from "electron";
// import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as channel from "./channel";
import {
  throwError,
  getCpuSerial,
  getMotherboardSerial,
  runWinword,
  execFileAsync,
  getDataFromAccessDatabase,
} from "./lib";
import dayjs from "dayjs";
import * as consts from "@/lib/constants";
import * as hxzyHmis from "./hmis_hxzy";
import type { GetRequest } from "@/api/http_types";
import type {
  Detection,
  GetDataFromAccessDatabaseParams,
  UploadByIdParams,
  UploadByZhParams,
} from "@/api/database_types";
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

    width: 1024,
    height: 768,
  });

  win.menuBarVisible = false;

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    console.log("did-finish-load");
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

app.whenReady().then(createWindow);

ipcMain.handle(channel.openDevTools, () => {
  if (!win) return;
  win.webContents.openDevTools();
});

ipcMain.handle(channel.openPath, async (e, path: string) => {
  void e;
  const data = await shell.openPath(path);
  return data;
});

ipcMain.handle(channel.getCpuSerial, getCpuSerial);
ipcMain.handle(channel.getMotherboardSerial, getMotherboardSerial);

ipcMain.handle(channel.fetchInfoFromHXZY, async (e, params: GetRequest) => {
  // ?type=csbts&param=91022070168
  void e;
  const data = await hxzyHmis.getFn(params);
  return data;
});

ipcMain.handle(
  channel.uploadToHXZYByZh,
  async (e, params: UploadByZhParams) => {
    void e;
    try {
      const startDate = dayjs().startOf("day").format(consts.DATE_FORMAT);
      const endDate = dayjs().endOf("day").format(consts.DATE_FORMAT);

      const detections = await getDataFromAccessDatabase<Detection>({
        driverPath: params.driverPath,
        databasePath: params.databasePath,
        sql: `SELECT TOP 1 * FROM detections WHERE szIDsWheel ='${params.zh}' AND tmnow BETWEEN #${startDate}# AND #${endDate}# ORDER BY tmnow DESC`,
      });

      const detection = detections[0];

      if (!detection) {
        throwError("未找到该车轮编号的检测记录");
      }

      const detectionDatas = await getDataFromAccessDatabase({
        driverPath: params.driverPath,
        databasePath: params.databasePath,
        sql: `SELECT * FROM detections_data WHERE opid ='${detection.szIDs}'`,
      });

      const data = {
        detection,
        detectionDatas,
      };

      const user = detection.szUsername || "";

      const request: hxzyHmis.PostRequest = {
        data: [
          {
            eq_ip: "",
            eq_bh: "",
            dh: "",
            zx: detection.szWHModel || "",
            zh: detection.szIDsWheel || "",
            TSFF: "超声波",
            TSSJ: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
            TFLAW_PLACE: "",
            TFLAW_TYPE: "",
            TVIEW: "",
            CZCTZ: user,
            CZCTY: user,
            LZXRBZ: user,
            LZXRBY: user,
            XHCZ: user,
            XHCY: user,
            TSZ: user,
            TSZY: user,
            CT_RESULT: detection.szResult || "",
          },
        ],
      };
    } catch (e) {
      throwError(e);
    }
  }
);

ipcMain.handle(
  channel.uploadToHXZYById,
  async (e, params: UploadByIdParams) => {
    void e;
    try {
      const detections = await getDataFromAccessDatabase<Detection>({
        driverPath: params.driverPath,
        databasePath: params.databasePath,
        sql: `SELECT * FROM detections WHERE szIDs ='${params.id}'`,
      });

      const detection = detections[0];

      if (!detection) {
        throwError("未找到该检测记录");
      }

      const detectionDatas = await getDataFromAccessDatabase({
        driverPath: params.driverPath,
        databasePath: params.databasePath,
        sql: `SELECT * FROM detections_data WHERE opid ='${detection.szIDs}'`,
      });

      return {
        detection,
        detectionDatas,
      };
    } catch (e) {
      throwError(e);
    }
  }
);

ipcMain.handle(channel.autoInputToVC, async (e, data: AutoInputToVCParams) => {
  void e;
  const exePath = data.driverPath;

  try {
    const cp = await execFileAsync(exePath, [
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
      throwError(cp.stderr);
    }

    return cp.stdout;
  } catch (error) {
    throwError(error);
  }
});

ipcMain.handle(channel.printer, async (e, data: string) => {
  void e;
  try {
    const cp = await runWinword(data).catch(() => shell.openPath(data));
    return cp;
  } catch (error) {
    throwError(error);
  }
});

ipcMain.handle(
  channel.getDataFromAccessDatabase,
  async (e, params: GetDataFromAccessDatabaseParams) => {
    void e;

    try {
      const data = await getDataFromAccessDatabase({
        driverPath: params.driverPath,
        databasePath: params.databasePath,
        sql: params.query,
      });

      return data;
    } catch (e) {
      throwError(e);
    }
  }
);

ipcMain.handle(channel.mem, async () => {
  const processMemoryInfo = await process.getProcessMemoryInfo();
  const freemem = processMemoryInfo.residentSet;

  return {
    totalmem: process.getSystemMemoryInfo().total,
    freemem,
  };
});
