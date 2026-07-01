import * as mathjs from "mathjs";

export const mathFormat = (value?: unknown, options?: mathjs.FormatOptions) => {
  const numberfiyValue = Number.parseFloat(String(value));

  if (Number.isNaN(numberfiyValue)) {
    return "";
  }

  return mathjs.format(mathjs.bignumber(numberfiyValue), {
    notation: "fixed",
    precision: 2,
    ...options,
  });
};

export const divideBy10 = (value: number) => {
  return mathjs.format(
    mathjs.divide(mathjs.bignumber(value), mathjs.bignumber(10)),
    {
      notation: "fixed",
      precision: 1,
    },
  );
};
