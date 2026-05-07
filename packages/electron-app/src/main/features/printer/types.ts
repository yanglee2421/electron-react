import type { Printer } from "./printer";

export interface IPCContract {
  "printer/chr501": {
    args: [string];
    return: ReturnType<Printer["getDataForCHR501"]>;
  };
}
