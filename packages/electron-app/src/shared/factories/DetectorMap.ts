import type { Detecotor } from "#main/modules/mdb";
import * as mathjs from "mathjs";

export class DetectorMap {
  private detectors: Detecotor[];

  constructor(detectors: Detecotor[]) {
    this.detectors = detectors;
  }

  private getDetector(nBoard: number, nChannel: number) {
    const detector = this.detectors.find(
      (detector) =>
        detector.nBoard === nBoard && detector.nChannel === nChannel,
    );

    return detector || null;
  }

  zsj(nBoard: number, nChannel: number) {
    const detector = this.getDetector(nBoard, nChannel);

    if (!detector) {
      return "";
    }

    return mathjs
      .divide(mathjs.bignumber(detector.nWAngle), mathjs.bignumber(10))
      .toString();
  }
  bc(nBoard: number, nChannel: number) {
    const detector = this.getDetector(nBoard, nChannel);

    if (!detector) {
      return "";
    }

    return mathjs
      .divide(mathjs.bignumber(detector.nDBSub), mathjs.bignumber(10))
      .toString();
  }
  ts(nBoard: number, nChannel: number) {
    const detector = this.getDetector(nBoard, nChannel);

    if (!detector) {
      return "";
    }
  }
}
