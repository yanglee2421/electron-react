import type { schema } from "@yanglee2421/external-db";
import * as mathjs from "mathjs";
import { divideBy10, mathFormat } from "./math";

type AnniversaryItem = typeof schema.quartorRecordInfo.$inferSelect;

export const resolveQT503 = (rows: AnniversaryItem[]) => {
  const r = rows.map((item) => {
    const list = [
      mathjs.bignumber(item.fVerTgMaxB0),
      mathjs.bignumber(item.fVerTgMaxB1),
      mathjs.bignumber(item.fVerTgMaxB2),
      mathjs.bignumber(item.fVerTgMaxB3),
      mathjs.bignumber(item.fVerTgMaxB4),
      mathjs.bignumber(item.fVerTgMaxB5),
      mathjs.bignumber(item.fVerTgMaxB6),
      mathjs.bignumber(item.fVerTgMaxB7),
      mathjs.bignumber(item.fVerTgMaxB8),
      mathjs.bignumber(item.fVerTgMaxB9),
      mathjs.bignumber(item.fVerTgMaxB10),
      mathjs.bignumber(item.fVerTgMaxB11),
      mathjs.bignumber(item.fVerTgMaxB12),
      mathjs.bignumber(item.fVerTgMaxB13),
    ];

    return {
      nBoard: item.nBoardIndex,
      nChannel: item.nChannelIndex,
      tmNow: item.tmNow,
      user: item.szUserName,
      finallyResult: !!item.bResult,
      horResult: !!item.bHorResult,
      horValue: mathFormat(item.fHorResult || 0),
      verResult: !!item.bVerResult,
      verValue: mathjs.format(
        mathjs.add(
          mathjs.abs(mathjs.max(...list)),
          mathjs.abs(mathjs.min(...list)),
        ),
        { precision: 2, notation: "fixed" },
      ),
      decResult: !!item.bDesResult,
      decValue: divideBy10(item.nDesAtten || 0),
      attResult: !!item.bAttResult,
      attValue: divideBy10(item.nDynMax || 0),
    };
  });

  return {
    rows: r,
  };
};
