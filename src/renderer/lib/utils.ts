export const mapGroupBy = <TElement, TKey>(
  items: TElement[],
  callbackFn: (element: TElement, index: number) => TKey,
) => {
  const resultMap = new Map<TKey, TElement[]>();

  items.reduce((latestResult, item, index) => {
    const mapKey = callbackFn(item, index);
    const mapValue = latestResult.get(mapKey);

    if (Array.isArray(mapValue)) {
      mapValue.push(item);
    } else {
      latestResult.set(mapKey, [item]);
    }

    return latestResult;
  }, resultMap);

  return resultMap;
};

export const minmax = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const inRange = (value: number, min: number, max: number) => {
  return Object.is(value, minmax(value, min, max));
};

export const chunk = <TElement>(
  array: TElement[],
  size: number,
): TElement[][] => {
  const result: TElement[][] = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }

  return result;
};

export type CallbackFn<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => TReturn;

export const promiseTry = <TArgs extends unknown[], TReturn>(
  callback: CallbackFn<TArgs, TReturn>,
  ...args: TArgs
) => new Promise<TReturn>((resolve) => resolve(callback(...args)));

export const log: typeof console.log = (...args) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export type ElementOf<TList> = TList extends (infer TElement)[]
  ? TElement
  : never;

export type ParamsOf<TFunc> = TFunc extends (...args: infer TParams) => void
  ? TParams
  : never;
