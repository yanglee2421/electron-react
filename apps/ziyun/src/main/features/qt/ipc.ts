import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { QT } from "./qt";

export const registerIPCHandlers = (qt: QT) => {
  ipcHandle("qt/501", (_, id) => qt.fetch501Data(id));
  ipcHandle("qt/502", (_, ids) => qt.fetch502Data(ids));
  ipcHandle("qt/503", (_, id) => qt.fetch503Data(id));
  ipcHandle("qt/52a", (_, p) => qt.fetch52AData(p));
  ipcHandle("qt/53a", (_, p) => qt.fetch53AData(p));

  ipcHandle("qt/detections", (_, p) => qt.fetchDetections(p));
  ipcHandle("qt/verifies", (_, p) => qt.fetchVerifies(p));
  ipcHandle("qt/quartors", (_, p) => qt.fetchQuartors(p));
  ipcHandle("qt/anniversary", (_, p) => qt.anniversary(p));
  ipcHandle("qt/anniversary-detail", (_, id) => qt.anniversaryDetail(id));
  ipcHandle("qt/users", (_) => qt.fetchUsers());
  ipcHandle("qt/upsert_users", (_, p) => qt.upsertUsers(p));
  ipcHandle("qt/delete_users", (_, p) => qt.deleteUsers(p));
  ipcHandle("qt/get_config", () => qt.getConfig());
  ipcHandle("qt/set_config", (_, p) => qt.setConfig(p));

  ipcHandle("qt/setup-app", (_, p) => qt.setupApp(p));
  ipcHandle("qt/current-db-path", () => qt.getCurrentLocalDB());
  ipcHandle("qt/yiqiConfig/list", () => qt.deviceConfigList());
  ipcHandle("qt/yiqiConfig/lib", (_, p) => qt.setDeviceConfigLib(p));
  ipcHandle("qt/yiqiConfig/flag", (_, p) => qt.setDeviceConfigFlag(p));
  ipcHandle("qt/start-app", () => qt.startApp());

  return () => {
    ipcRemoveHandle("qt/501");
    ipcRemoveHandle("qt/502");
    ipcRemoveHandle("qt/503");
    ipcRemoveHandle("qt/52a");
    ipcRemoveHandle("qt/53a");

    ipcRemoveHandle("qt/detections");
    ipcRemoveHandle("qt/verifies");
    ipcRemoveHandle("qt/quartors");
    ipcRemoveHandle("qt/anniversary");
    ipcRemoveHandle("qt/anniversary-detail");
    ipcRemoveHandle("qt/users");
    ipcRemoveHandle("qt/upsert_users");
    ipcRemoveHandle("qt/delete_users");
    ipcRemoveHandle("qt/get_config");
    ipcRemoveHandle("qt/set_config");

    ipcRemoveHandle("qt/setup-app");
    ipcRemoveHandle("qt/start-app");
    ipcRemoveHandle("qt/current-db-path");
    ipcRemoveHandle("qt/yiqiConfig/list");
    ipcRemoveHandle("qt/yiqiConfig/lib");
    ipcRemoveHandle("qt/yiqiConfig/flag");
  };
};
