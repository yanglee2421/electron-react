import * as mathjs from "mathjs";

export const mathFormat = (value: number, options?: mathjs.FormatOptions) => {
  return mathjs.format(mathjs.bignumber(value), {
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
