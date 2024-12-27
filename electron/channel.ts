export const queryQuartors = "quartors/get";
export const queryVerifies = "verifies/get";
export const openPath = "openPath";

export type DbParamsBase<TParams = unknown> = {
  path: string;
  password: string;
} & TParams;
