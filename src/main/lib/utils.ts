export const devLog: typeof console.log = (...args) => {
  if (!import.meta.env.DEV) return;
  console.log(...args);
};

export const devError: typeof console.error = (...args) => {
  if (!import.meta.env.DEV) return;
  console.error(...args);
};

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
