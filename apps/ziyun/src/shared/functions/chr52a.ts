import type { DetectionData } from "#main/features/mdb/types";
import { chunk, mapGroupBy } from "@yotulee/run";
import { mathFormat } from "./math";

export type MemoInfo = Map<string, number>;
export type FlawGroup = Map<string, DetectionData[]>;

export const resolveMemoInfo = (params: string | null): MemoInfo => {
  const result = new Map<string, number>();

  if (!params) {
    return result;
  }

  return chunk(params.split(""), 8).reduce((map, item) => {
    const board = Number(item.at(0)) ? 1 : 0;
    const channel = item.at(1);
    const flawType = Number(item.at(-1));

    map.set(`${board}-${channel}`, flawType);

    return map;
  }, result);
};

export const calcFlawType = (type?: number) => {
  switch (type) {
    case 2:
      return "透声不良";
    case 4:
      return "晶粗";
    case 8:
      return "压装不良";
    case 1:
      return "裂纹";
    default:
      return "";
  }
};

export const calcPlace = (board: number, channel: number) => {
  const direction = board ? "右" : "左";

  switch (channel) {
    case 0:
      return direction + "穿透";
    case 1:
      return direction + "卸荷槽";
    case 2:
    case 3:
    case 4:
      return direction + "轮座";
    default:
      return "";
  }
};

export const calcPlaceNote = (
  type: string,
  place: string,
  flawMap: FlawGroup,
) => {
  if (type !== "裂纹") {
    return type;
  }

  return flawMap
    .get(place)
    ?.map((flaw) => mathFormat(flaw.fltValueX, { precision: 0 }))
    .join(" ");
};

export const calcNote = (datas: DetectionData[], szMemo: string | null) => {
  if (!szMemo) {
    return "";
  }

  const chunks = chunk(szMemo?.split("") || [], 8);
  const flawMap = mapGroupBy(datas, (el) => calcPlace(el.nBoard, el.nChannel));
  const flawsNote = chunks
    .map((item) => {
      const board = Number(item.at(0)) ? 1 : 0;
      const channel = Number(item.at(1));
      const type = calcFlawType(Number(item.at(-1)));
      const place = calcPlace(board, channel);

      return `${place}: ${calcPlaceNote(type, place, flawMap)}`;
    })
    .join("; ");

  return "不合格(" + flawsNote + "), 请人工复探!";
};
