import type { DetectionData } from "#main/modules/mdb";
import { isClamped, mapGroupBy } from "@yotulee/run";
import dayjs from "dayjs";
import * as mathjs from "mathjs";

export const calculateDirection = (nBoard: number) => {
  //board(板卡)：0.左 1.右
  switch (nBoard) {
    case 1:
      return "右";
    case 0:
      return "左";
    default:
      return "";
  }
};

export const calculatePlace = (nChannel: number) => {
  switch (nChannel) {
    case 0:
      return "穿透";
    case 1:
    case 2:
      return "卸荷槽";
    case 3:
      // 51deg
      return "外";
    case 4:
      // 44deg
      return "内";
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
    case 14:
    case 15:
    default:
      return "车轴";
  }
};

export const isLeftFlaw = (nBoard: number) => {
  return calculateDirection(nBoard) === "左";
};

export const isRightFlaw = (nBoard: number) => {
  return calculateDirection(nBoard) === "右";
};

export const isLZFlaw = (nChannel: number) => {
  const place = calculatePlace(nChannel);

  switch (place) {
    case "内":
    case "外":
      return true;
    default:
      return false;
  }
};

export const isXHCFlaw = (nChannel: number) => {
  return calculatePlace(nChannel) === "卸荷槽";
};

export const isCTFlaw = (nChannel: number) => {
  return calculatePlace(nChannel) === "穿透";
};

export const tmnowToTSSJ = (tmnow: string) => {
  return dayjs(tmnow).format("YYYY-MM-DD HH:mm:ss");
};

export const detectionDataToTPlace = (detectionData: DetectionData) => {
  const direction = calculateDirection(detectionData.nBoard);
  const place = calculatePlace(detectionData.nChannel);

  return direction + place;
};

interface Flaw {
  fltValueX: number;
}

const calculateXHCFlawsByFirstFlaw = <TFlaw extends Flaw>(
  flaws: TFlaw[],
  firstFlaw: TFlaw,
) => {
  const exceptedSecondFlawX = firstFlaw.fltValueX + 10;
  const secondFlaw = flaws.find((flaw) =>
    isClamped(flaw.fltValueX, exceptedSecondFlawX - 3, exceptedSecondFlawX + 3),
  );

  if (!secondFlaw) {
    return [firstFlaw];
  }

  const exceptedThirdFlawX = secondFlaw?.fltValueX + 5;
  const thirdFlaw = flaws.find((flaw) =>
    isClamped(flaw.fltValueX, exceptedThirdFlawX - 3, exceptedThirdFlawX + 3),
  );

  if (!thirdFlaw) {
    return [firstFlaw, secondFlaw];
  }

  return [firstFlaw, secondFlaw, thirdFlaw];
};

const uniqueList = <TEl, TKey>(
  list: TEl[],
  fn: (el: TEl, index: number) => TKey,
): TEl[] => {
  const map = list.reduce((map, el, index) => {
    const key = fn(el, index);

    return map.set(key, el);
  }, new Map<TKey, TEl>());

  return [...map.values()];
};

export const calculateXHCFlaws = <TFlaw extends Flaw>(
  flaws: TFlaw[],
): TFlaw[] => {
  // 如果去重后的缺陷数量不足4个，直接返回去重结果，不进行组合计算
  const uniquedFlaws = uniqueList(flaws, (flaw) =>
    Math.floor(flaw.fltValueX),
  ).toSorted((a, b) => a.fltValueX - b.fltValueX);

  if (uniquedFlaws.length < 4) {
    return uniquedFlaws;
  }

  let result: TFlaw[] = [];

  for (const flaw of uniquedFlaws) {
    const list = calculateXHCFlawsByFirstFlaw(uniquedFlaws, flaw);

    if (list.length === 3) {
      return list;
    }

    if (list.length > result.length) {
      result = list;
    }
  }

  return result;
};

interface Flaw {
  nAtten: number;
}

export const calculateNAttenDiff = (...attens: string[]) => {
  const attenBignumbers = attens.map((atten) => mathjs.bignumber(atten));
  const minAtten = mathjs.min(...attenBignumbers);
  const maxAtten = mathjs.max(...attenBignumbers);

  return mathjs.subtract(maxAtten, minAtten).toString();
};

export const calculateQuartorResult = (...attens: string[]) => {
  const isOk = attens.every((atten) => {
    return mathjs.smallerEq(mathjs.bignumber(atten), mathjs.bignumber(6));
  });

  return isOk ? "合格" : "不合格";
};

interface Flaw {
  nBoard: number;
  nChannel: number;
}

interface FlawLike {
  nBoard: number;
  nChannel: number;
}

export const groupByNChannel = <TFlaw extends FlawLike>(flaws: TFlaw[]) => {
  return mapGroupBy(flaws, (flaw) => {
    if (flaw.nBoard === 0) {
      switch (flaw.nChannel) {
        case 0:
          return "left1";
        case 1:
          return "left2";
        case 2:
          return "left3";
        case 3:
          return "left4";
        case 4:
          return "left5";
        case 5:
          return "left6";
        default:
          return "_trash";
      }
    } else {
      switch (flaw.nChannel) {
        case 0:
          return "right7";
        case 1:
          return "right8";
        case 2:
          return "right9";
        case 3:
          return "right10";
        case 4:
          return "right11";
        case 5:
          return "right12";
        default:
          return "_trash";
      }
    }
  });
};

export const createNChannelGroup = <TFlaw extends FlawLike>(flaws: TFlaw[]) => {
  const flawMap = groupByNChannel(flaws);
  const left1 = flawMap.get("left1") || [];
  const left2 = flawMap.get("left2") || [];
  const left3 = flawMap.get("left3") || [];
  const left4 = flawMap.get("left4") || [];
  const left5 = flawMap.get("left5") || [];
  const left6 = flawMap.get("left6") || [];
  const right7 = flawMap.get("right7") || [];
  const right8 = flawMap.get("right8") || [];
  const right9 = flawMap.get("right9") || [];
  const right10 = flawMap.get("right10") || [];
  const right11 = flawMap.get("right11") || [];
  const right12 = flawMap.get("right12") || [];

  return {
    left1,
    left2,
    left3,
    left4,
    left5,
    left6,
    right7,
    right8,
    right9,
    right10,
    right11,
    right12,
  };
};

export const calculateDecResult = (Dec_Max: number) => {
  return mathjs
    .divide(mathjs.bignumber(Dec_Max), mathjs.bignumber(10))
    .toString();
};

export const calculateAttResult = (Att_Max: number) => {
  return mathjs
    .divide(mathjs.bignumber(Att_Max), mathjs.bignumber(10))
    .toString();
};

export const calculateXHCChNo = (nBoard: number, zx: string) => {
  switch (zx) {
    case "RD2":
      return nBoard ? "ch10" : "ch4";
    case "RE2B":
      return nBoard ? "ch11" : "ch5";
    default:
      return "";
  }
};
