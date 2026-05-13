import * as mathjs from "mathjs";

export const divideBy10 = (value: number) => {
  return mathjs.format(
    mathjs.divide(mathjs.bignumber(value), mathjs.bignumber(10)),
    {
      notation: "fixed",
      precision: 1,
    },
  );
};
