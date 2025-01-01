import type { IpcRenderer, WebUtils } from "electron";

export const ipcRenderer: IpcRenderer = Reflect.get(window, "ipcRenderer");
export const webUtils: WebUtils = Reflect.get(
  window,
  "webUtils",
);

export const redirect_key = "redirect_path";
export const login_path = "/login";
