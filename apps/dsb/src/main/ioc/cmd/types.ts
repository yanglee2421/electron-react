import type { Cmd } from "./cmd";

export interface IPCContract {
  "cmd/click-start": {
    args: [boolean];
    return: ReturnType<Cmd["setAutoScript"]>;
  };
}
