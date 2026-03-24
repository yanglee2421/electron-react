import { calculateXHCFlaws } from "#shared/functions/flawDetection";
import { mapGroupBy } from "@yotulee/run";
import * as mathjs from "mathjs";

interface Flaw {
  nBoard: number;
  nChannel: number;
  fltValueX: number;
  nAtten: number;
}

export class FlawMatrix<TFlaw extends Flaw> {
  private flaws: TFlaw[];

  constructor(flaws: TFlaw[]) {
    this.flaws = flaws;
  }

  /**
   * 根据行列索引获取缺陷对象
   * @param nBoard
   * @param nChannel
   * @param flawIndex 缺陷索引，表示第几个缺陷（从0开始）
   * @returns 缺陷对象，如果不存在则返回null
   */
  getFlaw(nBoard: number, nChannel: number, flawIndex: number) {
    const flaws = this.flaws.filter(
      (flaw) => flaw.nBoard === nBoard && flaw.nChannel === nChannel,
    );
    const flaw = flaws.at(flawIndex);

    return flaw || null;
  }
  /**
   * 根据行列索引获取缺陷值X
   * @param nBoard
   * @param nChannel
   * @param flawIndex 缺陷索引，表示第几个缺陷值X（从0开始）
   */
  getFlawX(nBoard: number, nChannel: number, flawIndex: number) {
    const flaw = this.getFlaw(nBoard, nChannel, flawIndex);

    if (!flaw) {
      return "";
    }

    return mathjs.format(flaw.fltValueX, { notation: "fixed", precision: 0 });
  }
  jy(nBoard: number, nChannel: number) {
    const flaw = this.getFlaw(nBoard, nChannel, 0);

    if (!flaw) {
      return "";
    }

    return mathjs
      .divide(mathjs.bignumber(flaw.nAtten), mathjs.bignumber(10))
      .toString();
  }

  /**
   * 根据nBoard和nChannel获取缺陷值X的矩阵
   * @param flawNo 缺陷编号，表示第几个缺陷值X（从1开始）
   * @param nBoard 0 或 1，表示0是左，1是右
   * @param nChannel 3, 4，表示通道号,给3,4以外的值返回空字符串
   */
  getLZFlawX(flawNo: number, nBoard: number, nChannel: number) {
    switch (nChannel) {
      case 3:
      case 4:
        break;
      default:
        return "";
    }

    const lzFlaws = this.flaws.filter((flaw) => {
      const boardMatch = flaw.nBoard === nBoard;
      if (!boardMatch) {
        return false;
      }

      const channelMatch = flaw.nChannel === 3 || flaw.nChannel === 4;
      return channelMatch;
    });
    const group = mapGroupBy(lzFlaws, (flaw) => Math.floor(flaw.fltValueX));
    let latestKey = Number.NEGATIVE_INFINITY;
    const flawX = [...group.keys()]
      .sort((a, b) => a - b)
      .filter((key) => {
        if (key > latestKey + 5) {
          latestKey = key;
          return true;
        }

        return false;
      });

    const key = flawX[flawNo - 1];
    const flaws = group.get(key) || [];
    const flaw = flaws.find(
      (flaw) => flaw.nBoard === nBoard && flaw.nChannel === nChannel,
    );

    if (!flaw) {
      return "";
    }

    return mathjs.format(flaw.fltValueX, { notation: "fixed", precision: 0 });
  }

  /**
   * 根据nBoard获取XHC缺陷值X
   * @param flawNo 缺陷编号，表示第几个缺陷值X（从1开始）
   * @param nBoard 0 或 1，表示0是左，1是右
   */
  getXHCFlawX(flawNo: number, nBoard: number) {
    const xhcFlaws = this.flaws.filter(
      (flaw) => nBoard === flaw.nBoard && flaw.nChannel === 1,
    );
    const validFlaws = calculateXHCFlaws(xhcFlaws);
    const flaw = validFlaws.at(flawNo - 1);

    if (!flaw) {
      return "";
    }

    return mathjs.format(flaw.fltValueX, { notation: "fixed", precision: 0 });
  }

  getAtten(nBoard: number, nChannel: number) {
    const flaw = this.getFlaw(nBoard, nChannel, 0);

    return flaw?.nAtten;
  }
}
