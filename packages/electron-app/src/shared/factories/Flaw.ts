import { calculateXHCFlaws } from "#shared/functions/flawDetection";
import { mapGroupBy } from "@yotulee/run";
import * as mathjs from "mathjs";

interface Flaw {
  nBoard: number;
  nChannel: number;
  fltValueX: number;
  nAtten: number;
}

export class FlawQuery<TFlaw extends Flaw> {
  private data: TFlaw[];
  public id: string;

  constructor(data: TFlaw[], id?: string) {
    this.data = data;
    this.id = id || "";
  }

  flaws() {
    return this.data.slice(0);
  }
  left() {
    return new FlawBoardQuery(this, 0);
  }
  right() {
    return new FlawBoardQuery(this, 1);
  }
}

class FlawBoardQuery<TFlaw extends Flaw> {
  public parent: FlawQuery<TFlaw>;
  public nBoard: number;

  constructor(flawQuery: FlawQuery<TFlaw>, nBoard: number) {
    this.parent = flawQuery;
    this.nBoard = nBoard;
  }

  flaws() {
    return this.parent.flaws().filter((flaw) => flaw.nBoard === this.nBoard);
  }
  lz() {
    return new FlawLZQuery(this);
  }
  xhc() {
    return new FlawXHCQuery(this);
  }
  ct() {
    return new FlawCTQuery(this);
  }
}

class FlawLZQuery<TFlaw extends Flaw> {
  public parent: FlawBoardQuery<TFlaw>;

  constructor(flawBoardQuery: FlawBoardQuery<TFlaw>) {
    this.parent = flawBoardQuery;
  }

  flaws() {
    return this.parent.parent.flaws().filter((flaw) => {
      const isLZFlaw = flaw.nChannel === 3 || flaw.nChannel === 4;
      const boardMatched = flaw.nBoard === this.parent.nBoard;

      return isLZFlaw && boardMatched;
    });
  }
  group() {
    let key = 0;
    let previousX = -Infinity;
    const group = mapGroupBy(
      this.flaws().toSorted((a, b) => a.fltValueX - b.fltValueX),
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

  check() {
    const group = this.group();

    if (group.size < 11) {
      throw new Error(
        `${this.parent.parent.id ? `ID: ${this.parent.parent.id}, ` : ""}${this.parent.nBoard ? "右" : "左"}LZ缺陷数量不足，当前数量为${group.size}`,
      );
    }
  }
  deg51() {
    return new LZDegQuery(this, 3);
  }
  deg44() {
    return new LZDegQuery(this, 4);
  }
}

class LZDegQuery<TFlaw extends Flaw> {
  public parent: FlawLZQuery<TFlaw>;
  public nChannel: number;

  constructor(parent: FlawLZQuery<TFlaw>, nChannel: number) {
    this.parent = parent;
    this.nChannel = nChannel;
  }

  flaws() {
    return this.parent.parent.parent
      .flaws()
      .filter(
        (flaw) =>
          flaw.nChannel === this.nChannel &&
          flaw.nBoard === this.parent.parent.nBoard,
      );
  }

  check() {
    const excetpedCount = this.nChannel === 3 ? 6 : 5;
    const group = this.group();

    return group.size >= excetpedCount;
  }

  group() {
    let key = 0;
    let previousX = -Infinity;
    const group = mapGroupBy(
      this.flaws().toSorted((a, b) => a.fltValueX - b.fltValueX),
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

class FlawXHCQuery<TFlaw extends Flaw> {
  public parent: FlawBoardQuery<TFlaw>;

  constructor(flawQuery: FlawBoardQuery<TFlaw>) {
    this.parent = flawQuery;
  }

  flaws() {
    // Performance optimization:
    // filter XHC flaws directly from the root node,
    // instead of filtering from all flaws in the parent query.
    return this.parent.parent
      .flaws()
      .filter(
        (flaw) => flaw.nChannel === 1 && flaw.nBoard === this.parent.nBoard,
      );
  }
  check() {
    const flaws = this.flaws();
    const xhcFlaws = calculateXHCFlaws(flaws);

    if (xhcFlaws.length < 3) {
      throw new Error(
        `${this.parent.parent.id ? `ID: ${this.parent.parent.id}, ` : ""}${this.parent.nBoard ? "右" : "左"}XHC缺陷数量不足，当前数量为${xhcFlaws.length}`,
      );
    }
  }
  flaw(no: number) {
    const xhcFlaws = this.flaws();
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

class FlawCTQuery<TFlaw extends Flaw> {
  public parent: FlawBoardQuery<TFlaw>;

  constructor(boardQuery: FlawBoardQuery<TFlaw>) {
    this.parent = boardQuery;
  }

  flaws() {
    // Performance optimization:
    // filter CT flaws directly from the parent board flaws,
    // instead of filtering from all flaws in the parent query.
    return this.parent.parent
      .flaws()
      .filter(
        (flaw) => flaw.nChannel === 0 && flaw.nBoard === this.parent.nBoard,
      );
  }
  check() {
    const flaws = this.flaws();

    if (flaws.length < 1) {
      throw new Error(
        `${this.parent.parent.id ? `ID: ${this.parent.parent.id}, ` : ""}${this.parent.nBoard ? "右" : "左"}CT缺陷数量不足，当前数量为${flaws.length}`,
      );
    }
  }

  flaw(no: number = 1) {
    const flaws = this.flaws();

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
