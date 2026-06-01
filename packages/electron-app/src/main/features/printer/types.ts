import type { Printer } from "./printer";

export interface CHR502Input {
  ids: string[];
}

export interface CHR53AInput {
  ids: string[];
}

export interface ChannelImage {
  lct: string;
  rct: string;
  llz: string;
  rlz: string;
  lxh: string;
  rxh: string;
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
  "printer/chr53a": {
    args: [CHR53AInput];
    return: ReturnType<Printer["getDataForCHR53A"]>;
  };
  "printer/chr52a": {
    args: [string];
    return: ReturnType<Printer["getDataForCHR52A"]>;
  };
  "printer/print": {
    args: [];
    return: ReturnType<Printer["print"]>;
  };
}
