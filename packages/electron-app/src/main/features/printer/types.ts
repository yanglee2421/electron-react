import type { Printer } from "./printer";

export interface IPCContract {
  "printer/chr501": {
    args: [string];
    return: ReturnType<Printer["getDataForCHR501"]>;
  };
  "printer/chr502": {
    args: [];
    return: ReturnType<Printer["getDataForCHR502"]>;
  };
  "printer/print": {
    args: [];
    return: ReturnType<Printer["print"]>;
  };
}
