import type { Logger } from "./logger";

export interface ListOptions {
  level?: string;
  startDate: string;
  endDate: string;
  pageIndex: number;
  pageSize: number;
}

export interface IPCContract {
  "logger/list": {
    args: [ListOptions];
    return: ReturnType<Logger["handleList"]>;
  };
  "logger/delete": {
    args: [number];
    return: ReturnType<Logger["handleDelete"]>;
  };
  "logger/clear": {
    args: [];
    return: ReturnType<Logger["handleClear"]>;
  };
}
