import { fetchQT502 } from "#renderer/api/qt";
import { Loading } from "#renderer/components/Loading";
import { CHR502, type RowData } from "#renderer/components/pdf/502";
import { divideBy10 } from "#shared/functions/math";
import { Home } from "@mui/icons-material";
import { Alert, AlertTitle, Button } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { schema } from "@yanglee2421/external-db";
import { mapGroupBy } from "@yotulee/run";
import { Link, useSearchParams } from "react-router";

type Flaw = typeof schema.quartorsData.$inferSelect;

const calcFlawAtten = (flaws?: Flaw[]) => {
  if (!Array.isArray(flaws)) {
    return "";
  }

  const firstFlaw = flaws.at(0);

  if (!firstFlaw) {
    return "";
  }

  return typeof firstFlaw.nAtten === "number"
    ? divideBy10(firstFlaw.nAtten)
    : "";
};

const calcRowAtten = (group: Map<string, Flaw[]>) => {
  const meta: RowData = {
    lch0: calcFlawAtten(group.get("0-0")),
    lch1: calcFlawAtten(group.get("0-1")),
    lch2: calcFlawAtten(group.get("0-2")),
    lch3: calcFlawAtten(group.get("0-3")),
    lch4: calcFlawAtten(group.get("0-4")),
    rch0: calcFlawAtten(group.get("1-0")),
    rch1: calcFlawAtten(group.get("1-1")),
    rch2: calcFlawAtten(group.get("1-2")),
    rch3: calcFlawAtten(group.get("1-3")),
    rch4: calcFlawAtten(group.get("1-4")),
  };

  return meta;
};

const calcChName = (
  channel: number,
  flawsMap: Map<string, Flaw[]>,
  chNameMap: Map<string, string | null>,
) => {
  const leftFlawCount = flawsMap.get(`0-${channel}`)?.length;

  if (leftFlawCount) {
    return chNameMap.get(`0-${channel}`)?.replace(/[左右0]/g, "");
  }

  const rightFlawCount = flawsMap.get(`1-${channel}`)?.length;

  if (rightFlawCount) {
    return chNameMap.get(`1-${channel}`)?.replace(/[左右0]/g, "");
  }

  return "";
};

export const Component = () => {
  const [search] = useSearchParams();
  const user = search.get("user");
  const zx = search.get("zx");
  const date = search.get("date");
  const ids = search.getAll("row");
  const query = useQuery(
    fetchQT502({
      ids,
      user: user || "",
      zx: zx || "",
      date: date || "",
    }),
  );

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Alert>
          <AlertTitle>错误</AlertTitle>
          {query.error.message}
          <div></div>
          <Button
            component={Link}
            to={{ pathname: "/" }}
            variant="contained"
            color="error"
            sx={{ mt: 1 }}
            startIcon={<Home />}
          >
            回到首页
          </Button>
        </Alert>
      );
    }

    const { FACTORY_CLD, FACTORY_SBBH, FACTORY_SYRQ, rows, datas, channels } =
      query.data;
    const firstRow = rows.at(0);
    const chNameMap = channels.reduce((map, item) => {
      const board = item.nBoardIndex || 0;
      const nChannelIndex = item.nChannelIndex || 0;
      const channel = nChannelIndex - board * 6;

      map.set(`${board}-${channel}`, item.szName);

      return map;
    }, new Map<string, string | null>());

    const groups = rows.map((row) => {
      const rowFlaws = datas.filter((data) => {
        return Object.is(data.precId, row.recId);
      });
      const flawMap = mapGroupBy(
        rowFlaws,
        (flaw) => `${flaw.nBoard}-${flaw.nChannel}`,
      );

      return {
        row,
        flaws: rowFlaws,
        flawMap,
        atten: calcRowAtten(flawMap),
      };
    });

    const flawsMap = mapGroupBy(datas, (i) => `${i.nBoard}-${i.nChannel}`);

    return (
      <CHR502
        factory={FACTORY_CLD || ""}
        zx={firstRow?.szWhModel || ""}
        validateAt={firstRow?.tmNow || ""}
        equipmentNo={FACTORY_SBBH || ""}
        manufactureDate={FACTORY_SYRQ || ""}
        chName0={calcChName(0, flawsMap, chNameMap) || ""}
        chName1={calcChName(1, flawsMap, chNameMap) || ""}
        chName2={calcChName(2, flawsMap, chNameMap) || ""}
        chName3={calcChName(3, flawsMap, chNameMap) || ""}
        chName4={calcChName(4, flawsMap, chNameMap) || ""}
        rows={groups.map((g) => g.atten)}
      />
    );
  };

  return renderQuery();
};
