import * as mathjs from "mathjs";

export const calculateMaxDiff = (...strings: string[]) => {
  const numbers = strings.map((str) => Number.parseFloat(str));

  if (numbers.every((num) => Number.isNaN(num))) {
    return "";
  }

  const result = mathjs.subtract(
    mathjs.max(...numbers.map((n) => mathjs.bignumber(n))),
    mathjs.min(...numbers.map((n) => mathjs.bignumber(n))),
  );

  return result.toString();
};

export const calculateResult = (left: string, right: string): string => {
  if (typeof left === "string") {
    return typeof right === "string" ? "" : "不合格";
  }

  if (typeof right === "string") {
    return "不合格";
  }

  if (mathjs.larger(mathjs.bignumber(left), mathjs.bignumber(6))) {
    return "不合格";
  }

  if (mathjs.larger(mathjs.bignumber(right), mathjs.bignumber(6))) {
    return "不合格";
  }

  return "合格";
};
