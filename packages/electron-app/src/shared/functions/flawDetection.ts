import type { DetectionData } from "#main/modules/mdb";
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
  switch (nChannel) {
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
      return true;
    default:
      return false;
  }
};

export const isXHCFlaw = (nChannel: number) => {
  switch (nChannel) {
    case 1:
    case 2:
      return true;
    default:
      return false;
  }
};

export const isCTFlaw = (nChannel: number) => {
  return Object.is(nChannel, 0);
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
