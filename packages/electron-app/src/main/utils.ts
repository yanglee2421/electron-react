export type Callback<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => TReturn;

export const debounce = <TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay = 0,
) => {
  let timer: NodeJS.Timeout;
  return (...args: TArgs) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
