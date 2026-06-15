export type ElementOf<TList> = TList extends (infer TElement)[]
  ? TElement
  : never;

export type ParamsOf<TFunc> = TFunc extends (...args: infer TParams) => void
  ? TParams
  : never;

export type CallbackFn<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => TReturn;
