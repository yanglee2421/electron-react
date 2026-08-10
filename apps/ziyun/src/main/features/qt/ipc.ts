import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { QT } from "./qt";

export const registerIPCHandlers = (qt: QT) => {
  ipcHandle("qt/anniversary", () => qt.anniversary());
  ipcHandle("qt/anniversary-detail", (_, id) => qt.anniversaryDetail(id));
  ipcHandle("qt/501", (_, id) => qt.fetch501Data(id));
  ipcHandle("qt/502", (_, ids) => qt.fetch502Data(ids));
  ipcHandle("qt/503", (_, id) => qt.fetch503Data(id));
  ipcHandle("qt/setup-app", (_, p) => qt.setupApp(p));
  ipcHandle("qt/current-db-path", () => qt.getCurrentLocalDB());
  ipcHandle("qt/yiqiConfig/list", () => qt.deviceConfigList());
  ipcHandle("qt/yiqiConfig/lib", (_, p) => qt.setDeviceConfigLib(p));
  ipcHandle("qt/yiqiConfig/flag", (_, p) => qt.setDeviceConfigFlag(p));
  ipcHandle("qt/start-app", () => qt.startApp());

  return () => {
    ipcRemoveHandle("qt/anniversary");
    ipcRemoveHandle("qt/anniversary-detail");
    ipcRemoveHandle("qt/501");
    ipcRemoveHandle("qt/502");
    ipcRemoveHandle("qt/503");
    ipcRemoveHandle("qt/setup-app");
    ipcRemoveHandle("qt/current-db-path");
    ipcRemoveHandle("qt/yiqiConfig/list");
    ipcRemoveHandle("qt/yiqiConfig/lib");
    ipcRemoveHandle("qt/yiqiConfig/flag");
    ipcRemoveHandle("qt/start-app");
  };
};