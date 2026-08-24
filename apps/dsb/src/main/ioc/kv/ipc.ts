import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import { Observable } from "rxjs";
import type { KV } from "./kv";

export const ipc = (kv: KV) => {
  return new Observable<KV>((sub) => {
    ipcHandle("kv/clear", () => kv.clear());
    ipcHandle("kv/get-item", (_, p) => kv.getItem(p));
    ipcHandle("kv/remove-item", (_, p) => kv.removeItem(p));
    ipcHandle("kv/set-item", (_, p, v) => kv.setItem(p, v));
    sub.next(kv);

    return () => {
      ipcRemoveHandle("kv/clear");
      ipcRemoveHandle("kv/get-item");
      ipcRemoveHandle("kv/remove-item");
      ipcRemoveHandle("kv/set-item");
    };
  });
};
