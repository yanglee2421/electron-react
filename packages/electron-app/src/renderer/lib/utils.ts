export type ElementOf<TList> = TList extends (infer TElement)[]
  ? TElement
  : never;

export type ParamsOf<TFunc> = TFunc extends (...args: infer TParams) => void
  ? TParams
  : never;

export type CallbackFn<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => TReturn;

interface Node {
  id: string | number;
  parentId?: string | number;
  children?: Node[];
}

export const promiseTry = <TArgs extends unknown[], TReturn>(
  callbackFn: CallbackFn<TArgs, TReturn>,
  ...args: TArgs
) => new Promise<TReturn>((resolve) => resolve(callbackFn(...args)));

export const mapGroupBy = <TElement, TKey>(
  items: TElement[],
  callbackFn: CallbackFn<[TElement, number], TKey>,
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

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const isWithinRange = (value: number, min: number, max: number) => {
  return Object.is(value, clamp(value, min, max));
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

export const listToTree = (list: Node[]) => {
  const nodes = list.map<Node & { children: Node[] }>((el) => ({
    ...el,
    children: [],
  }));
  const map = new Map<string | number, Node & { children: Node[] }>();
  const tree: Node[] = [];

  for (const node of nodes) {
    map.set(node.id, node);
  }

  for (const node of nodes) {
    const parent = map.get(node.parentId || Number.NaN);

    if (parent) {
      parent.children.push(node);
    } else {
      tree.push(node);
    }
  }

  return tree;
};
