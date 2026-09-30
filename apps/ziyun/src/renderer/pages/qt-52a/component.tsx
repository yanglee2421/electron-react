import { fetchQT52A } from "#renderer/api/qt";
import { Loading } from "#renderer/components/Loading";
import { CHR52A, type ChannelRow } from "#renderer/components/pdf/52a";
import { mathFormat } from "#shared/functions/math";
import { Alert, AlertTitle } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { schema } from "@yanglee2421/external-db";
import { chunk, mapGroupBy } from "@yotulee/run";
import { useParams } from "react-router";

type MemoInfo = Map<string, number>;
type DetectionData = typeof schema.detectionsData.$inferSelect;
type FlawGroup = Map<string, DetectionData[]>;

const resolveMemoInfo = (params: string | null): MemoInfo => {
  const result: MemoInfo = new Map();

  if (!params) {
    return result;
  }
  // 001 011 031 041 901 911 931 941
  return chunk(params.split(""), 3).reduce((map, item) => {
    const originBoard = item.at(0) || "0";
    const board = Number.parseInt(originBoard) > 8 ? 1 : 0;
    const channel = item.at(1);
    const flawType = Number(item.at(-1));

    map.set(`${board}-${channel}`, flawType);

    return map;
  }, result);
};

// 111 1*16 + 1=17 1=裂纹|2=透声不良|3=晶粗|4=压装不良
const calcFlawType = (type?: number) => {
  switch (type) {
    case 1:
      return "裂纹";
    case 2:
      return "透声不良";
    case 3:
      return "晶粗";
    case 4:
      return "压装不良";
    default:
      return "";
  }
};

// 0穿透
// 1卸荷槽
// 2 a3
// 3 51
// 4 44
const calcPlace = (board: number, channel: number) => {
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

const calcPlaceNote = (type: string, place: string, flawMap: FlawGroup) => {
  if (type !== "裂纹") {
    return type;
  }

  return flawMap
    .get(place)
    ?.map((flaw) => mathFormat(flaw.fltValueX, { precision: 0 }))
    .join(" ");
};

const calcNote = (datas: DetectionData[], szMemo: string | null) => {
  if (!szMemo) {
    return "";
  }

  const chunks = chunk(szMemo.split("") || [], 3);
  const flawMap = mapGroupBy(datas, (el) => {
    return el.nBoard !== null && el.nChannel !== null
      ? calcPlace(el.nBoard, el.nChannel)
      : "";
  });

  const flawsNote = chunks
    .map((item) => {
      const originBoard = item.at(0) || "0";
      const board = Number.parseInt(originBoard) > 8 ? 1 : 0;
      const channel = Number(item.at(1));
      const type = calcFlawType(Number(item.at(-1)));
      const place = calcPlace(board, channel);

      return `${place}: ${calcPlaceNote(type, place, flawMap)}`;
    })
    .join("; ");

  return "不合格(" + flawsNote + "), 请人工复探!";
};

export const Component = () => {
  const params = useParams();
  const recordId = params.id!;
  const query = useQuery(fetchQT52A(recordId));

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Alert>
          <AlertTitle>错误</AlertTitle>
          {query.error.message}
        </Alert>
      );
    }

    const { FACTORY_CLD, record, datas, jpegs, channels } = query.data;
    const memoInfo = resolveMemoInfo(record.szMemo);
    const flawGroup = mapGroupBy(datas, (i) => `${i.nBoard}-${i.nChannel}`);
    const chNameMap = channels.reduce((map, item) => {
      const board = item.nBoardIndex || 0;
      const nChannelIndex = item.nChannelIndex || 0;
      const channel = nChannelIndex - board * 6;

      map.set(`${board}-${channel}`, item.szName);

      return map;
    }, new Map<string, string | null>());

    const leftChannels: ChannelRow[] = [];
    const rightChannels: ChannelRow[] = [];

    for (let i = 0; i < 5; i++) {
      leftChannels.push({
        name: chNameMap.get(`0-${i}`) || "",
        flaws:
          flawGroup
            .get(`0-${i}`)
            ?.map((flaw) => flaw.fltValueX?.toFixed(0) || "") || [],
        type: calcFlawType(memoInfo.get(`0-${i}`)),
      });
      rightChannels.push({
        name: chNameMap.get(`1-${i}`) || "",
        flaws:
          flawGroup
            .get(`1-${i}`)
            ?.map((flaw) => flaw.fltValueX?.toFixed(0) || "") || [],
        type: calcFlawType(memoInfo.get(`1-${i}`)),
      });
    }

    return (
      <CHR52A
        factory={FACTORY_CLD || ""}
        validateAt={record.tmNow || ""}
        zh={record.szZh || ""}
        zx={record.szWhModel || ""}
        imageLCT={jpegs.lct}
        imageLLZ={jpegs.llz}
        imageLXH={jpegs.lxh}
        imageRCT={jpegs.rct}
        imageRLZ={jpegs.rlz}
        imageRXH={jpegs.rxh}
        szIdsMake={record.szIdsMake || ""}
        szTmMake={record.szTmMake || ""}
        szIdsFirst={record.szIdsFirst || ""}
        szTmFirst={record.szTmFirst || ""}
        szIdsLast={record.szIdsLast || ""}
        szTmLast={record.szTmLast || ""}
        note={calcNote(datas, record.szMemo)}
        leftChannels={leftChannels}
        rightChannels={rightChannels}
      />
    );
  };

  return renderQuery();
};
