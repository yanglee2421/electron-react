import type { ElectronAPI } from "@electron-toolkit/preload";
import { exposeElectronAPI } from "@electron-toolkit/preload";
import { contextBridge } from "electron";

// --------- Expose some API to the Renderer process ---------
exposeElectronAPI();
contextBridge.exposeInMainWorld("$process", { argv: process.argv });

interface ElectronProcess {
  argv: string[];
}

declare global {
  interface Window {
    electron: ElectronAPI;
    electronProcess: ElectronProcess;
  }

  // interface ImportMeta {
  //   myname: string;
  // }

  // interface ImportMetaEnv {
  //   myname: string;
  // }
}
