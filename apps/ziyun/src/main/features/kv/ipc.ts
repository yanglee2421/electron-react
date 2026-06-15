import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { KV } from "./kv";

export const registerIPCHandlers = (kv: KV) => {
  ipcHandle("kv/get", (_, key: string) => {
    return kv.getItem(key);
  });
  ipcHandle("kv/set", (_, key: string, value: string) => {
    return kv.setItem(key, value);
  });
  ipcHandle("kv/remove", (_, key: string) => {
    return kv.removeItem(key);
  });
  ipcHandle("kv/clear", () => {
    return kv.clear();
  });

  return () => {
    ipcRemoveHandle("kv/get");
    ipcRemoveHandle("kv/set");
    ipcRemoveHandle("kv/remove");
    ipcRemoveHandle("kv/clear");
  };
};
