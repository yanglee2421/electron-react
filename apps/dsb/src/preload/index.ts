import type { ElectronAPI } from "@electron-toolkit/preload";
import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge } from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("electron", electronAPI);

declare global {
  interface Window {
    electron: ElectronAPI;
  }

  // interface ImportMeta {
  //   myname: string;
  // }

  // interface ImportMetaEnv {
  //   myname: string;
  // }
}
