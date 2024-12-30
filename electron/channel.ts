export const queryQuartors = "quartors/get";
export const queryVerifies = "verifies/get";
export const openPath = "openPath";
export const printer = "printer";
export const openDevTools = "openDevTools";

export type DbParamsBase<TParams = unknown> = {
  path: string;
  password: string;
  dsn: string;
} & TParams;
