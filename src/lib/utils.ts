import type { IpcRenderer, WebUtils } from "electron";
import * as channel from "@electron/channel";

export const ipcRenderer: IpcRenderer = Reflect.get(
  window,
  channel.ipcRenderer
);

export const webUtils: WebUtils = Reflect.get(window, channel.webUtils);
