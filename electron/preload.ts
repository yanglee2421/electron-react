import { contextBridge, ipcRenderer, webUtils } from "electron";
import * as channel from "@electron/channel";
// import * as os from "node:os";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld(channel.ipcRenderer, {
  on: ipcRenderer.on.bind(ipcRenderer),
  off: ipcRenderer.off.bind(ipcRenderer),
  send: ipcRenderer.send.bind(ipcRenderer),
  invoke: ipcRenderer.invoke.bind(ipcRenderer),
  removeAllListeners: ipcRenderer.removeAllListeners.bind(ipcRenderer),
  listenerCount: ipcRenderer.listenerCount.bind(ipcRenderer),
});

contextBridge.exposeInMainWorld(channel.webUtils, {
  getPathForFile: webUtils.getPathForFile.bind(webUtils),
});
