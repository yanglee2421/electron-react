import type { Cmd } from "./cmd";

export interface IPCContract {
  "cmd/click-start": {
    args: [];
    return: ReturnType<Cmd["clickStart"]>;
  };
}
