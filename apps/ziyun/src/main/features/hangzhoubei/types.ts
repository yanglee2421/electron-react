import type { Hangzhoubei } from "./hangzhoubei";
export type { I501Record } from "./501";
export type { I502Record } from "./502";
export type { I503 } from "./503";
export type { I52a } from "./52a";

export interface IPCContract {
  "HMIS/hangzhoubei_chr501": {
    args: [string];
    return: ReturnType<Hangzhoubei["handleUploadCHR501"]>;
  };
  "HMIS/hangzhoubei_chr502": {
    args: [string[]];
    return: ReturnType<Hangzhoubei["handleUploadCHR502"]>;
  };
  "HMIS/hangzhoubei_chr503": {
    args: [string];
    return: ReturnType<Hangzhoubei["handleUploadCHR503"]>;
  };
}
