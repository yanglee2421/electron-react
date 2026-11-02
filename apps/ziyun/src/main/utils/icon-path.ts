import { platform } from "@electron-toolkit/utils";
import { app } from "electron";
import path from "node:path";

export const calcIconPath = () => {
  if (platform.isWindows) {
    return path.join(app.getAppPath(), "resources/favicon.ico");
  }

  if (platform.isLinux) {
    return path.join(app.getAppPath(), "resources/icons/32x32.png");
  }

  return "";
};
