import type { KV } from "./kv";

export interface IPC {
  "kv/get-item": {
    args: [string];
    return: ReturnType<KV["getItem"]>;
  };
  "kv/set-item": {
    args: [string, string];
    return: ReturnType<KV["setItem"]>;
  };
  "kv/remove-item": {
    args: [string];
    return: ReturnType<KV["removeItem"]>;
  };
  "kv/clear": {
    args: [];
    return: ReturnType<KV["clear"]>;
  };
}
