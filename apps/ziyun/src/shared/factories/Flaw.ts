import { calculateXHCFlaws } from "#shared/functions/flawDetection";
import { mapGroupBy } from "@yotulee/run";
import * as mathjs from "mathjs";

interface Flaw {
  nBoard: number;
  nChannel: number;
  fltValueX: number;
  nAtten: number;
}

interface FlawGroup {
  readonly flaws: Flaw[];
}

interface BoardGroup {
  readonly flaws: Flaw[];
  readonly nBoard: number;
}

interface ChannelQuery {
  readonly flaws: Flaw[];
  readonly nBoard: number;
  readonly nChannel: number;

  check(): void;
  flaw(no: number): Flaw | null;
  flawX(no: number): string;
  flawAtten(no: number): string;
}

export class FlawQuery<TFlaw extends Flaw> implements FlawGroup {
  readonly flaws: TFlaw[];
  readonly id: string;

  constructor(flaws: TFlaw[], id?: string) {
    this.flaws = flaws;
    this.id = id || "";
  }

  left() {
    return new FlawBoardQuery(this.flaws, 0);
  }
  right() {
    return new FlawBoardQuery(this.flaws, 1);
  }
}

class FlawBoardQuery<TFlaw extends Flaw> implements BoardGroup {
  readonly flaws: TFlaw[];
  readonly nBoard: number;
  readonly id: string;

  constructor(flaws: TFlaw[], nBoard: number, id?: string) {
    this.flaws = flaws;
    this.nBoard = nBoard;
    this.id = id || "";
  }

  lz() {
    return new FlawLZQuery(this.flaws, this.nBoard, this.id);
  }
  xhc() {
    return new FlawXHCQuery(this.flaws, this.nBoard, 1, this.id);
  }
  ct() {
    return new FlawCTQuery(this.flaws, this.nBoard, 0, this.id);
  }
}

class FlawLZQuery<TFlaw extends Flaw> implements BoardGroup {
  readonly flaws: TFlaw[];
  readonly nBoard: number;
  readonly id: string;

  constructor(flaws: TFlaw[], nBoard: number, id?: string) {
    this.flaws = flaws;
    this.nBoard = nBoard;
    this.id = id || "";
  }

  deg51() {
    return new LZDegQuery(this.flaws, this.nBoard, 3, this.id);
  }
  deg44() {
    return new LZDegQuery(this.flaws, this.nBoard, 4, this.id);
  }
}

class LZDegQuery<TFlaw extends Flaw> implements ChannelQuery {
  readonly flaws: TFlaw[];
  readonly nBoard: number;
  readonly nChannel: number;
  readonly id: string;

  constructor(flaws: TFlaw[], nBoard: number, nChannel: number, id?: string) {
    this.flaws = flaws;
    this.nBoard = nBoard;
    this.nChannel = nChannel;
    this.id = id || "";
  }

  check() {
    const excetpedCount = this.nChannel === 3 ? 6 : 5;
    const group = this.group();

    if (group.size < excetpedCount) {
      const idPrefix = this.id ? `ID: ${this.id}, ` : "";
      const direction = this.nBoard ? "右" : "左";
      const message = `${idPrefix}${direction}LZ${this.nChannel === 3 ? "51" : "44"}缺陷数量不足，当前数量为${group.size}`;

      throw new Error(message);
    }
  }

  group() {
    let key = 0;
    let previousX = -Infinity;
    const group = mapGroupBy(
      this.flaws.toSorted((a, b) => a.fltValueX - b.fltValueX),
      (flaw) => {
        if (flaw.fltValueX > previousX + 10) {
          previousX = flaw.fltValueX;
          return ++key;
        }

        return key;
      },
    );

    return group;
  }

  flaw(no: number) {
    const group = this.group();

    if (this.nChannel === 3) {
      return group.get(no)?.at(0) || null;
    }

    if (this.nChannel === 4) {
      return group.get(no - 6)?.at(0) || null;
    }

    return null;
  }
  flawX(no: number) {
    const flaw = this.flaw(no);

    if (!flaw) {
      return "";
    }

    return mathjs.format(flaw.fltValueX, { notation: "fixed", precision: 0 });
  }
  flawAtten(no: number) {
    const flaw = this.flaw(no);

    if (!flaw) {
      return "0";
    }

    return mathjs
      .divide(mathjs.bignumber(flaw.nAtten), mathjs.bignumber(10))
      .toString();
  }
}

class FlawXHCQuery<TFlaw extends Flaw> implements ChannelQuery {
  readonly flaws: TFlaw[];
  readonly nBoard: number;
  readonly nChannel: number;
  readonly id: string;

  constructor(flaws: TFlaw[], nBoard: number, nChannel: number, id?: string) {
    this.flaws = flaws;
    this.nBoard = nBoard;
    this.nChannel = nChannel;
    this.id = id || "";
  }

  check() {
    const flaws = this.flaws;
    const xhcFlaws = calculateXHCFlaws(flaws);

    if (xhcFlaws.length < 3) {
      const idPrefix = this.id ? `ID: ${this.id}, ` : "";
      const direction = this.nBoard ? "右" : "左";

      throw new Error(
        `${idPrefix}${direction}XHC缺陷数量不足，当前数量为${xhcFlaws.length}`,
      );
    }
  }
  flaw(no: number) {
    const xhcFlaws = this.flaws;
    const validFlaws = calculateXHCFlaws(xhcFlaws);

    return validFlaws.at(no - 1) || null;
  }
  flawX(no: number) {
    const flaw = this.flaw(no);

    if (!flaw) {
      return "";
    }

    return mathjs.format(flaw.fltValueX, { notation: "fixed", precision: 0 });
  }
  flawAtten(no: number) {
    const flaw = this.flaw(no);

    if (!flaw) {
      return "0";
    }

    return mathjs
      .divide(mathjs.bignumber(flaw.nAtten), mathjs.bignumber(10))
      .toString();
  }
}

class FlawCTQuery<TFlaw extends Flaw> implements ChannelQuery {
  readonly flaws: TFlaw[];
  readonly nBoard: number;
  readonly nChannel: number;
  readonly id: string;

  constructor(flaws: TFlaw[], nBoard: number, nChannel: number, id?: string) {
    this.flaws = flaws;
    this.nBoard = nBoard;
    this.nChannel = nChannel;
    this.id = id || "";
  }

  check() {
    const flaws = this.flaws;

    if (flaws.length < 1) {
      const idPrefix = this.id ? `ID: ${this.id}, ` : "";
      const direction = this.nBoard ? "右" : "左";
      const message = `${idPrefix}${direction}CT缺陷数量不足，当前数量为${flaws.length}`;

      throw new Error(message);
    }
  }

  flaw(no: number = 1) {
    const flaws = this.flaws;

    return flaws.at(no - 1) || null;
  }
  flawX(no: number = 1) {
    const flaw = this.flaw(no);

    if (!flaw) {
      return "";
    }

    return mathjs.format(flaw.fltValueX, { notation: "fixed", precision: 0 });
  }
  flawAtten(no: number = 1) {
    const flaw = this.flaw(no);

    if (!flaw) {
      return "0";
    }

    return mathjs
      .divide(mathjs.bignumber(flaw.nAtten), mathjs.bignumber(10))
      .toString();
  }
}
