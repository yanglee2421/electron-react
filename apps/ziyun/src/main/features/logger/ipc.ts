import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Logger } from "./logger";

export const registerIPCHandlers = (logger: Logger) => {
  ipcHandle("logger/list", (_, options) => {
    return logger.handleList(options);
  });
  ipcHandle("logger/delete", (_, id) => {
    return logger.handleDelete(id);
  });
  ipcHandle("logger/clear", () => {
    return logger.handleClear();
  });

  return () => {
    ipcRemoveHandle("logger/list");
    ipcRemoveHandle("logger/delete");
    ipcRemoveHandle("logger/clear");
  };
};
