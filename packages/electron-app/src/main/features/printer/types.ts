import type { Printer } from "./printer";

export interface CHR502Input {
  ids: string[];
}

export interface IPCContract {
  "printer/chr501": {
    args: [string];
    return: ReturnType<Printer["getDataForCHR501"]>;
  };
  "printer/chr502": {
    args: [CHR502Input];
    return: ReturnType<Printer["getDataForCHR502"]>;
  };
  "printer/chr503": {
    args: [string];
    return: ReturnType<Printer["getDataForCHR503"]>;
  };
  "printer/print": {
    args: [];
    return: ReturnType<Printer["print"]>;
  };
}
