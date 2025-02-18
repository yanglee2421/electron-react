export const queryQuartors = "quartors/get";
export const queryVerifies = "verifies/get";
export const openPath = "openPath";
export const printer = "printer";
export const openDevTools = "openDevTools";
export const heartbeat = "heartbeat";
export const mem = "mem";
export const queryDetections = "queryDetections";

export const ipcRenderer = "ipcRenderer";
export const webUtils = "webUtils";

export type DbParamsBase<TParams = unknown> = {
  path: string;
  password: string;
  dsn: string;
} & TParams;
