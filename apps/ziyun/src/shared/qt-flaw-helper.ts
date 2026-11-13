import type { schema } from "@yanglee2421/external-db";

type Flaw = typeof schema.quartorsData.$inferSelect;

export class FlawHelper {
  private originalFlaws: Flaw[];
  private _sortedFlaws: Flaw[];

  constructor(flaws: Flaw[]) {
    this.originalFlaws = flaws;
    this._sortedFlaws = [];
  }
  dispose() {
    this.originalFlaws = [];
    this._sortedFlaws = [];
  }

  private get sortedFlaws() {
    if (this._sortedFlaws.length === 0) {
      this._sortedFlaws = this.originalFlaws.toSorted((a, b) => {
        const aValue = a.fltValueX || 0;
        const bValue = b.fltValueX || 0;

        return aValue - bValue;
      });
    }

    return this._sortedFlaws;
  }

  get leftCtOriginal() {
    return this.sortedFlaws.filter((f) => f.nBoard === 0 && f.nChannel === 0);
  }
  get leftCt() {
    return this.leftCtOriginal.at(-1);
  }
  get rightCtOriginal() {
    return this.sortedFlaws.filter((f) => f.nBoard === 1 && f.nChannel === 0);
  }
  get rightCt() {
    return this.rightCtOriginal.at(-1);
  }
  get leftXhcOriginal() {
    return this.sortedFlaws.filter((f) => f.nBoard === 0 && f.nChannel === 1);
  }
  get leftXhc() {
    return FlawHelper.calcXhcFlaws(this.leftXhcOriginal);
  }
  get rightXhcOrignal() {
    return this.sortedFlaws.filter((f) => f.nBoard === 1 && f.nChannel === 1);
  }
  get rightXhc() {
    return FlawHelper.calcXhcFlaws(this.rightXhcOrignal);
  }
  get leftLzOutterOriginal() {
    return this.sortedFlaws.filter((f) => f.nBoard === 0 && f.nChannel === 3);
  }
  get leftLzOutter() {
    return this.leftLzOutterOriginal;
  }
  get rightLzOutterOriginal() {
    return this.sortedFlaws.filter((f) => f.nBoard === 1 && f.nChannel === 3);
  }
  get rightLzOutter() {
    return this.rightLzOutterOriginal;
  }
  get leftLzInnerOrignal() {
    return this.sortedFlaws.filter((f) => f.nBoard === 0 && f.nChannel === 4);
  }
  get leftLzInner() {
    const list = this.leftLzInnerOrignal;

    return [
      ...Array.from<null>({ length: 11 - list.length }).fill(null),
      ...list,
    ];
  }
  get rightLzInnerOriginal() {
    return this.sortedFlaws.filter((f) => f.nBoard === 1 && f.nChannel === 4);
  }
  get rightLzInner() {
    const list = this.rightLzInnerOriginal;

    return [
      ...Array.from<null>({ length: 11 - list.length }).fill(null),
      ...list,
    ];
  }
  get leftA3() {
    return this.sortedFlaws.filter((f) => f.nBoard === 0 && f.nChannel === 1);
  }
  get rightA3() {
    return this.sortedFlaws.filter((f) => f.nBoard === 1 && f.nChannel === 1);
  }
  get leftLzOriginal() {
    return [...this.leftLzOutterOriginal, ...this.leftLzInnerOrignal];
  }
  get leftLz() {
    const outter: (Flaw | null)[] = this.leftLzOutter;
    const inner: (Flaw | null)[] = this.leftLzInner;

    return [
      ...outter.slice(0, 6),
      ...Array<null>(Math.max(0, 6 - outter.length)).fill(null),
      ...Array<null>(Math.max(0, 5 - inner.length)).fill(null),
      ...inner.slice(-5),
    ];
  }
  get rightLzOriginal() {
    return [...this.rightLzOutterOriginal, ...this.rightLzInnerOriginal];
  }
  get rightLz() {
    const outter: (Flaw | null)[] = this.rightLzOutter;
    const inner: (Flaw | null)[] = this.rightLzInner;

    return [
      ...outter.slice(0, 6),
      ...Array<null>(Math.max(0, 6 - outter.length)).fill(null),
      ...Array<null>(Math.max(0, 5 - inner.length)).fill(null),
      ...inner.slice(-5),
    ];
  }

  private static toX(flaw: Flaw) {
    return flaw.fltValueX || 0;
  }

  private static findFlawsByFirst(originalFlaws: Flaw[], flaw1: Flaw) {
    const flaws1 = [flaw1];
    const excepted2 = this.toX(flaw1) + 10;
    const flaw2 = originalFlaws
      .filter((i) => !flaws1.includes(i))
      .toSorted((a, b) => {
        return (
          Math.abs(this.toX(a) - excepted2) - Math.abs(this.toX(b) - excepted2)
        );
      })
      .at(0);

    if (!flaw2) {
      return flaws1;
    }

    const flaws2 = [flaw1, flaw2];
    const excepted3 = this.toX(flaw2) + 5;
    const flaw3 = originalFlaws
      .filter((i) => !flaws2.includes(i))
      .toSorted((a, b) => {
        return (
          Math.abs(this.toX(a) - excepted3) - Math.abs(this.toX(b) - excepted3)
        );
      })
      .at(0);

    if (!flaw3) {
      return flaws2;
    }

    return [flaw1, flaw2, flaw3];
  }

  static calcXhcFlaws(flaws: Flaw[]) {
    if (flaws.length < 4) {
      return flaws;
    }

    let result: Flaw[] = [];

    for (const flaw of flaws) {
      const xhcFlaws = this.findFlawsByFirst(flaws, flaw);

      if (xhcFlaws.length === 3) {
        return xhcFlaws;
      }

      if (xhcFlaws.length > result.length) {
        result = xhcFlaws;
      }
    }

    return result;
  }
}
