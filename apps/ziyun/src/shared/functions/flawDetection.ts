import type { DetectionData } from "#main/features/mdb/types";
import dayjs from "dayjs";

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
      return "卸荷槽";
    case 2:
      return "轮座";
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

export const tmnowToTSSJ = (tmnow: string | Date) => {
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
  const result = [firstFlaw];
  const exceptedSecondFlawX = firstFlaw.fltValueX + 10;
  const secondFlaw = flaws
    .filter((flaw) => {
      return !result.some((item) => Object.is(flaw.fltValueX, item.fltValueX));
    })
    .toSorted((a, b) => {
      return (
        Math.abs(a.fltValueX - exceptedSecondFlawX) -
        Math.abs(b.fltValueX - exceptedSecondFlawX)
      );
    })
    .at(0);

  if (!secondFlaw) {
    return result;
  } else {
    result.push(secondFlaw);
  }

  const exceptedThirdFlawX = secondFlaw?.fltValueX + 5;
  const thirdFlaw = flaws
    .filter((flaw) => {
      return !result.some((item) => Object.is(flaw.fltValueX, item.fltValueX));
    })
    .toSorted((a, b) => {
      return (
        Math.abs(a.fltValueX - exceptedThirdFlawX) -
        Math.abs(b.fltValueX - exceptedThirdFlawX)
      );
    })
    .at(0);

  if (!thirdFlaw) {
    return result;
  } else {
    result.push(thirdFlaw);
  }

  return result;
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

interface Flaw {
  nBoard: number;
  nChannel: number;
}
