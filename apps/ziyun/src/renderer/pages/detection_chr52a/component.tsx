import { fetchCHR52AData } from "#renderer/api/printer";
import { Loading } from "#renderer/components/Loading";
import type { ChannelRow } from "#renderer/components/pdf/52a";
import { CHR52A } from "#renderer/components/pdf/52a";
import {
  calcFlawType,
  calcNote,
  resolveMemoInfo,
} from "#shared/functions/chr52a";
import { Alert, AlertTitle } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { mapGroupBy } from "@yotulee/run";
import { useParams } from "react-router";

export const Component = () => {
  const params = useParams();
  const recordId = params.id!;
  const query = useQuery(fetchCHR52AData(recordId));

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

    const { corporation, record, datas, jpegs, detectors } = query.data;
    const memoInfo = resolveMemoInfo(record.szMemo);
    const flawGroup = mapGroupBy(datas, (i) => `${i.nBoard}-${i.nChannel}`);
    const chNameMap = detectors.reduce((map, item) => {
      const board = item.nBoard;
      const channel = item.nChannel;

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
        factory={corporation.Factory || ""}
        validateAt={record.tmnow || ""}
        zh={record.szIDsWheel || ""}
        zx={record.szWHModel || ""}
        imageLCT={jpegs.lct}
        imageLLZ={jpegs.llz}
        imageLXH={jpegs.lxh}
        imageRCT={jpegs.rct}
        imageRLZ={jpegs.rlz}
        imageRXH={jpegs.rxh}
        szIdsFirst={record.szIDsFirst || ""}
        szIdsLast={record.szIDsLast || ""}
        szIdsMake={record.szIDsMake || ""}
        szTmFirst={record.szTMFirst || ""}
        szTmLast={record.szTMLast || ""}
        szTmMake={record.szTMMake || ""}
        note={calcNote(datas, record.szMemo)}
        leftChannels={leftChannels}
        rightChannels={rightChannels}
      />
    );
  };

  return renderQuery();
};
