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
