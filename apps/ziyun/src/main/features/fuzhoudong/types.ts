import type { Fuzhoudong } from "./fuzhoudong";
export type { I501Record } from "./501";
export type { I502Record } from "./502";
export type { I503 } from "./503";
export type { I52a } from "./52a";

export interface IPCContract {
  "HMIS/fuzhoudong_chr501": {
    args: [string];
    return: ReturnType<Fuzhoudong["handleUploadCHR501"]>;
  };
  "HMIS/fuzhoudong_chr502": {
    args: [string[]];
    return: ReturnType<Fuzhoudong["handleUploadCHR502"]>;
  };
  "HMIS/fuzhoudong_chr503": {
    args: [string];
    return: ReturnType<Fuzhoudong["handleUploadCHR503"]>;
  };
}
