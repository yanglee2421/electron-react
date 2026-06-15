import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import type { ElectronAPI } from "@electron-toolkit/preload";

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
