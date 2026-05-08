import type { Detecotor, VerifyData } from "#main/features/mdb/types";
import { mapGroupBy } from "@yotulee/run";
import * as mathjs from "mathjs";
import { calculateXHCFlaws } from "./flawDetection";

const LZ_FLAW_SPACE = 7;

const lzFlawGroup = (flaws: VerifyData[]) => {
  let key = 0;
  let latestX = Number.NEGATIVE_INFINITY;

  const group = mapGroupBy(
    flaws.toSorted((a, b) => a.fltValueX - b.fltValueX),
    (flaw) => {
      if (flaw.fltValueX > latestX + LZ_FLAW_SPACE) {
        latestX = flaw.fltValueX;

        return ++key;
      }

      return key;
    },
  );

  return group;
};

const channelKey = (nBoard: number, nChannel: number) => {
  return `${nBoard}-${nChannel}`;
};

const divideBy10 = (value: number) => {
  return mathjs.format(
    mathjs.divide(mathjs.bignumber(value), mathjs.bignumber(10)),
    {
      notation: "fixed",
      precision: 1,
    },
  );
};

const mathTs = (dbSub: number, atten?: number) => {
  if (!atten) {
    return "";
  }

  return mathjs.format(
    mathjs.divide(
      mathjs.add(mathjs.bignumber(dbSub), mathjs.bignumber(atten)),
      mathjs.bignumber(10),
    ),
    {
      notation: "fixed",
      precision: 1,
    },
  );
};

interface DetectorInfo {
  zsj: string;
  bc: string;
  jy: string;
  ts: string;
  place: string;
  direction: string;
}

interface FlawInfo {
  value: string;
}

export const resolveCHR501 = (flaws: VerifyData[], detectors: Detecotor[]) => {
  const detectorGroup = mapGroupBy(detectors, (detector) =>
    channelKey(detector.nBoard, detector.nChannel),
  );
  const flawGroup = mapGroupBy(flaws, (flaw) => {
    return channelKey(flaw.nBoard, flaw.nChannel);
  });

  const detectorInfo = new Map<string, DetectorInfo>();

  for (const [key, [detector]] of detectorGroup) {
    if (!detector) continue;

    const flaw = flawGroup.get(key)?.at(0) || null;
    const flawAtten = flaw ? divideBy10(flaw.nAtten) : "";

    detectorInfo.set(key, {
      zsj: divideBy10(detector.nWAngle),
      bc: divideBy10(detector.nDBSub),
      jy: flawAtten,
      ts: mathTs(detector.nDBSub, flaw?.nAtten),
      place: detector.szName,
      direction: detector.nBoard === 0 ? "左" : "右",
    });
  }

  const flawInfo = new Map<string, FlawInfo[]>();
  const l01Flaws = flawGroup.get("0-3") || [];
  const l02Flaws = flawGroup.get("0-4") || [];
  const lA3Flaws = flawGroup.get("0-2") || [];
  const r01Flaws = flawGroup.get("1-3") || [];
  const r02Flaws = flawGroup.get("1-4") || [];
  const rA3Flaws = flawGroup.get("1-2") || [];
  const leftLZFlaws = l01Flaws.slice().concat(l02Flaws, lA3Flaws);
  const rightLZFlaws = r01Flaws.slice().concat(r02Flaws, rA3Flaws);
  const leftLZFlawGroup = lzFlawGroup(leftLZFlaws);
  const rightLZFlawGroup = lzFlawGroup(rightLZFlaws);

  for (const [key, flaws] of flawGroup) {
    switch (key) {
      // CT
      case "0-0":
      case "1-0":
        flawInfo.set(
          key,
          flaws.map((flaw) => {
            return {
              value: mathjs.format(flaw.fltValueX, {
                notation: "fixed",
                precision: 0,
              }),
            };
          }),
        );
        break;
      // A01
      case "0-1":
      case "1-1":
        flawInfo.set(
          key,
          calculateXHCFlaws(flaws).map((flaw) => {
            return {
              value: mathjs.format(flaw.fltValueX, {
                notation: "fixed",
                precision: 0,
              }),
            };
          }),
        );
        break;
      // A03
      case "0-2":
      case "1-2":
        flawInfo.set(
          key,
          flaws.map((flaw) => {
            return {
              value: mathjs.format(flaw.fltValueX, {
                notation: "fixed",
                precision: 0,
              }),
            };
          }),
        );
        break;
      // 01
      case "0-3":
        flawInfo.set(
          key,
          Array.from({ length: 13 }, (_, index) => {
            const group = leftLZFlawGroup.get(index + 1) || [];
            const flaw = group.find((flaw) => flaw.nChannel === 3);

            return {
              value: flaw
                ? mathjs.format(flaw.fltValueX, {
                    notation: "fixed",
                    precision: 0,
                  })
                : "",
            };
          }),
        );
        break;
      case "1-3":
        flawInfo.set(
          key,
          Array.from({ length: 13 }, (_, index) => {
            const group = rightLZFlawGroup.get(index + 1) || [];
            const flaw = group.find((flaw) => flaw.nChannel === 3);

            return {
              value: flaw
                ? mathjs.format(flaw.fltValueX, {
                    notation: "fixed",
                    precision: 0,
                  })
                : "",
            };
          }),
        );
        break;
      // 02
      case "0-4":
        flawInfo.set(
          key,
          Array.from({ length: 13 }, (_, index) => {
            const group = leftLZFlawGroup.get(index + 1) || [];
            const flaw = group.find((flaw) => flaw.nChannel === 4);

            return {
              value: flaw
                ? mathjs.format(flaw.fltValueX, {
                    notation: "fixed",
                    precision: 0,
                  })
                : "",
            };
          }),
        );
        break;
      case "1-4":
        flawInfo.set(
          key,
          Array.from({ length: 13 }, (_, index) => {
            const group = rightLZFlawGroup.get(index + 1) || [];
            const flaw = group.find((flaw) => flaw.nChannel === 4);

            return {
              value: flaw
                ? mathjs.format(flaw.fltValueX, {
                    notation: "fixed",
                    precision: 0,
                  })
                : "",
            };
          }),
        );
        break;
      default:
        continue;
    }
  }

  return {
    detectorInfo,
    flawInfo,
  };
};
