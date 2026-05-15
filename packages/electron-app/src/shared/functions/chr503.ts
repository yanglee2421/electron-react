import type { QuartorYearlyData } from "#main/features/mdb/types";

import { divideBy10, mathFormat } from "./math";

export const resolveCHR503 = (datas: QuartorYearlyData[]) => {
  const rows = datas
    .filter((data) => {
      const nChannel = data.nChannel;

      switch (nChannel) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          return true;
        default:
          return false;
      }
    })
    .map((data) => {
      return {
        nBoard: data.nBoard,
        nChannel: data.nChannel,
        tmNow: data.tmNow,
        user: data.szUsername,
        finallyResult: data.bResult,
        horResult: data.bResultHor,
        horValue: mathFormat(data.Hor_fResult),
        verResult: data.bResultVer,
        verValue: mathFormat(data.Ver_fResult),
        decResult: data.bResultDec,
        decValue: divideBy10(data.Dec_Max),
        attResult: data.bResultAtt,
        attValue: divideBy10(data.Att_Max),
      };
    });

  return { rows };
};
