import type { QuartorData } from "#main/features/mdb/types";
import { fetchCHR502Data } from "#renderer/api/printer";
import { Loading } from "#renderer/components/Loading";
import type { RowData } from "#renderer/components/pdf/502";
import { CHR502 } from "#renderer/components/pdf/502";
import { divideBy10 } from "#shared/functions/math";
import { Alert, AlertTitle } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { mapGroupBy } from "@yotulee/run";
import dayjs from "dayjs";
import { useSearchParams } from "react-router";

const renderChName = (
  channel: number,
  flawsMap: Map<string, QuartorData[]>,
  chNameMap: Map<string, string | null>,
) => {
  const leftFlawCount = flawsMap.get(`0-${channel}`)?.length;

  if (leftFlawCount) {
    return chNameMap.get(`0-${channel}`)?.replace(/[左右0]/g, "") || "";
  }

  const rightFlawCount = flawsMap.get(`1-${channel}`)?.length;

  if (rightFlawCount) {
    return chNameMap.get(`1-${channel}`)?.replace(/[左右0]/g, "") || "";
  }

  return "";
};

export const Component = () => {
  const [search] = useSearchParams();
  const ids = search.getAll("row");
  const query = useQuery(fetchCHR502Data({ ids }));

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

    const { flaws, records, corporation, previousRecord, detectors } =
      query.data;
    const chNameMap = detectors.reduce((map, item) => {
      const board = item.nBoard;
      const channel = item.nChannel;

      map.set(`${board}-${channel}`, item.szName);

      return map;
    }, new Map<string, string | null>());
    const flawsMap = mapGroupBy(flaws, (i) => `${i.nBoard}-${i.nChannel}`);
    const rows = records.map<RowData>((record) => {
      const chFlaws = flaws.filter((flaw) => {
        return Object.is(flaw.opid, record.szIDs);
      });
      const flawMap = mapGroupBy(chFlaws, (f) => `${f.nBoard}-${f.nChannel}`);
      const lch0Atten = flawMap.get("0-0")?.at(0)?.nAtten;
      const lch1Atten = flawMap.get("0-1")?.at(0)?.nAtten;
      const lch2Atten = flawMap.get("0-2")?.at(0)?.nAtten;
      const lch3Atten = flawMap.get("0-3")?.at(0)?.nAtten;
      const lch4Atten = flawMap.get("0-4")?.at(0)?.nAtten;
      const rch0Atten = flawMap.get("1-0")?.at(0)?.nAtten;
      const rch1Atten = flawMap.get("1-1")?.at(0)?.nAtten;
      const rch2Atten = flawMap.get("1-2")?.at(0)?.nAtten;
      const rch3Atten = flawMap.get("1-3")?.at(0)?.nAtten;
      const rch4Atten = flawMap.get("1-4")?.at(0)?.nAtten;

      return {
        lch0: typeof lch0Atten === "number" ? divideBy10(lch0Atten) : "",
        lch1: typeof lch1Atten === "number" ? divideBy10(lch1Atten) : "",
        lch2: typeof lch2Atten === "number" ? divideBy10(lch2Atten) : "",
        lch3: typeof lch3Atten === "number" ? divideBy10(lch3Atten) : "",
        lch4: typeof lch4Atten === "number" ? divideBy10(lch4Atten) : "",
        rch0: typeof rch0Atten === "number" ? divideBy10(rch0Atten) : "",
        rch1: typeof rch1Atten === "number" ? divideBy10(rch1Atten) : "",
        rch2: typeof rch2Atten === "number" ? divideBy10(rch2Atten) : "",
        rch3: typeof rch3Atten === "number" ? divideBy10(rch3Atten) : "",
        rch4: typeof rch4Atten === "number" ? divideBy10(rch4Atten) : "",
      };
    });

    return (
      <CHR502
        factory={corporation.Factory || ""}
        zx={records.at(0)?.szWHModel || ""}
        validateAt={dayjs(records.at(-1)?.tmnow).format("YYYY-MM-DD HH:mm:ss")}
        equipmentNo={corporation.DeviceNO || ""}
        manufactureDate={corporation.prodate}
        lastManufactureDate={previousRecord?.tmnow || ""}
        chName0={renderChName(0, flawsMap, chNameMap)}
        chName1={renderChName(1, flawsMap, chNameMap)}
        chName2={renderChName(2, flawsMap, chNameMap)}
        chName3={renderChName(3, flawsMap, chNameMap)}
        chName4={renderChName(4, flawsMap, chNameMap)}
        rows={rows}
      />
    );
  };

  return renderQuery();
};
