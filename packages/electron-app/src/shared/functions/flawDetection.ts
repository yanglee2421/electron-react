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
      return "外";
    case 4:
      return "内";
    case 5:
    case 6:
    case 7:
    case 8:
      return "轮座";
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
    case "轮座":
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

/**
 * 计算校验灵敏度
 * @param nAtten 从数据库读到的nAtten值
 * @returns 校验灵敏度
 */
export const calculateJY = (nAtten: number) => {
  return mathjs
    .divide(mathjs.bignumber(nAtten), mathjs.bignumber(10))
    .toString();
};

/**
 * 计算探伤灵敏度
 * @param nAtten 从数据库读到的nAtten值
 * @param nDBSub 从数据库读到的nDBSub值
 * @returns 探伤灵敏度
 */
export const calculateTS = (nAtten: number, nDBSub: number) => {
  return mathjs
    .divide(
      mathjs.add(mathjs.bignumber(nAtten), mathjs.bignumber(nDBSub)),
      mathjs.add(mathjs.bignumber(nAtten), mathjs.bignumber("1")),
    )
    .toString();
};

/**
 * 计算拆射角度
 * @param nWAngle 从数据库读到的nWAngle值
 * @returns 拆射角度
 */
export const calculateZSJ = (nWAngle: number) => {
  return mathjs
    .divide(mathjs.bignumber(nWAngle), mathjs.bignumber(10))
    .toString();
};

interface Flaw {
  fltValueX: number;
}

/**
 * 计算轮座缺陷，要求fltValueX相差至少10
 * @param flaws 轮座缺陷列表
 * @returns 过滤后的轮座缺陷列表
 */
export const calculateLZFlaws = <TFlaw extends Flaw>(flaws: TFlaw[]) => {
  return flaws
    .sort((a, b) => a.fltValueX - b.fltValueX)
    .reduce<TFlaw[]>((result, b) => {
      const lastX = result.at(-1)?.fltValueX || Number.NEGATIVE_INFINITY;
      const diff = b.fltValueX - lastX;

      if (diff >= 10) {
        return [...result, b];
      }

      return result;
    }, []);
};

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

export const calculateXHCFlaws = <TFlaw extends Flaw>(flaws: TFlaw[]) => {
  const oirginMap = new Map<number, TFlaw[]>();
  const flawMap = flaws
    .sort((a, b) => a.fltValueX - b.fltValueX)
    .reduce((result, flaw) => {
      return new Map(result).set(
        flaw.fltValueX,
        calculateXHCFlawsByFirstFlaw(flaws, flaw),
      );
    }, oirginMap);

  const flawGroups = [...flawMap.values()];
  const validatedFlaws = flawGroups.find((flaws) => flaws.length === 3);
  if (validatedFlaws) return validatedFlaws;

  return flawGroups.sort((a, b) => b.length - a.length).at(0) || [];
};

interface Flaw {
  nAtten: number;
}

export const calculateNAtten = (flaw: Flaw) => {
  return mathjs
    .divide(mathjs.bignumber(flaw.nAtten), mathjs.bignumber(10))
    .toString();
};

export const calculateNAttenDiff = (...flaws: Flaw[]) => {
  const minAtten = mathjs.min(
    ...flaws.map((flaw) => mathjs.bignumber(flaw.nAtten)),
  );
  const maxAtten = mathjs.max(
    ...flaws.map((flaw) => mathjs.bignumber(flaw.nAtten)),
  );

  return mathjs
    .divide(mathjs.subtract(maxAtten, minAtten), mathjs.bignumber(10))
    .toString();
};

export const calculateQuartorResult = (...flaws: Flaw[]) => {
  const minAtten = mathjs.min(
    ...flaws.map((flaw) => mathjs.bignumber(flaw.nAtten)),
  );
  const maxAtten = mathjs.max(
    ...flaws.map((flaw) => mathjs.bignumber(flaw.nAtten)),
  );
  const diff = mathjs.subtract(maxAtten, minAtten);
  const result = mathjs.smallerEq(diff, mathjs.bignumber(6));

  if (typeof result === "boolean") {
    return result ? "合格" : "不合格";
  }

  throw new Error("Unexpected result type");
};

interface Flaw {
  nBoard: number;
  nChannel: number;
}

export const groupFlaws = <TFlaw extends Flaw>(flaws: TFlaw[]) => {
  return mapGroupBy(flaws, (flaw) => {
    const isLeftCT = isLeftFlaw(flaw.nBoard) && isCTFlaw(flaw.nChannel);
    if (isLeftCT) return "leftCT";

    const isRightCT = isRightFlaw(flaw.nBoard) && isCTFlaw(flaw.nChannel);
    if (isRightCT) return "rightCT";

    const isLeftXHC = isLeftFlaw(flaw.nBoard) && isXHCFlaw(flaw.nChannel);
    if (isLeftXHC) return "leftXHC";

    const isRightXHC = isRightFlaw(flaw.nBoard) && isXHCFlaw(flaw.nChannel);
    if (isRightXHC) return "rightXHC";

    const isLeftLZ = isLeftFlaw(flaw.nBoard) && isLZFlaw(flaw.nChannel);
    if (isLeftLZ) return "leftLZ";

    const isRightLZ = isRightFlaw(flaw.nBoard) && isLZFlaw(flaw.nChannel);
    if (isRightLZ) return "rightLZ";
  });
};

export const createFlawGroup = <TFlaw extends Flaw>(flaws: TFlaw[]) => {
  const flawMap = groupFlaws(flaws);
  const leftCT = flawMap.get("leftCT") || [];
  const rightCT = flawMap.get("rightCT") || [];
  const leftXHC = flawMap.get("leftXHC") || [];
  const rightXHC = flawMap.get("rightXHC") || [];
  const leftLZ = flawMap.get("leftLZ") || [];
  const rightLZ = flawMap.get("rightLZ") || [];

  return {
    /**
     * 左穿透1伤
     */
    leftCT,
    /**
     * 右穿透1伤
     */
    rightCT,
    /**
     * 左卸荷槽3伤，
     *
     * 第一个伤和第二个伤的fltValueX相差10，
     *
     * 第二个伤和第三个伤的fltValueX相差5
     */
    leftXHC: calculateXHCFlaws(leftXHC),
    /**
     * 右卸荷槽3伤，
     *
     * 第一个伤和第二个伤的fltValueX相差10，
     *
     * 第二个伤和第三个伤的fltValueX相差5
     */
    rightXHC: calculateXHCFlaws(rightXHC),
    /**
     * 左轮座11伤
     *
     * fltValueX相差至少10，理论相差15
     */
    leftLZ: calculateLZFlaws(leftLZ),
    /**
     * 右轮座11伤
     *
     * fltValueX相差至少10，理论相差15
     */
    rightLZ: calculateLZFlaws(rightLZ),
  };
};
