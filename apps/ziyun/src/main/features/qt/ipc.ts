import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { QT } from "./qt";

export const registerIPCHandlers = (qt: QT) => {
  ipcHandle("qt/anniversary", () => qt.anniversary());
  ipcHandle("qt/anniversary-detail", (_, id) => qt.anniversaryDetail(id));
  ipcHandle("qt/503", (_, id) => qt.fetch503Data(id));
  ipcHandle("qt/501", (_, id) => qt.fetch501Data(id));
  ipcHandle("qt/setup-app", (_, p) => qt.setupApp(p));

  return () => {
    ipcRemoveHandle("qt/anniversary");
    ipcRemoveHandle("qt/anniversary-detail");
    ipcRemoveHandle("qt/503");
    ipcRemoveHandle("qt/501");
    ipcRemoveHandle("qt/setup-app");
  };
};
