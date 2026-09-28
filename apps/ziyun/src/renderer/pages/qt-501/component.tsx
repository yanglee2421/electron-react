import { fetchQT501 } from "#renderer/api/qt";
import { Loading } from "#renderer/components/Loading";
import { CHR501 } from "#renderer/components/pdf/501";
import {
  calcFlaws,
  calcTs,
  divide10,
  type ChannelData,
} from "#shared/functions/chr501";
import { Home } from "@mui/icons-material";
import { Alert, AlertTitle, Button } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { schema } from "@yanglee2421/external-db";
import { mapGroupBy } from "@yotulee/run";
import { Link, useParams } from "react-router";

type Flaw = typeof schema.verifiesData.$inferSelect;
type Channel = typeof schema.channels.$inferSelect;

const resolveFlaws = (
  flaws: Flaw[],
  channels: Channel[],
): Map<string, ChannelData> => {
  const map = new Map<string, ChannelData>();
  const chNameMap = channels.reduce((map, item) => {
    const board = item.nBoardIndex || 0;
    const nChannelIndex = item.nChannelIndex || 0;
    const channel = nChannelIndex - board * 6;

    map.set(`${board}-${channel}`, item.szName);

    return map;
  }, new Map<string, string | null>());
  const flawMap = mapGroupBy(flaws, (f) => `${f.nBoard}-${f.nChannel}`);

  for (const [key, chFlaws] of flawMap) {
    const flaw = chFlaws.at(0);

    if (!flaw) {
      continue;
    }

    const zsj =
      typeof flaw.nWangle === "number" ? divide10(flaw.nWangle, 1) : "";
    const bc = typeof flaw.nDbSub === "number" ? divide10(flaw.nDbSub, 1) : "";
    const jy = typeof flaw.nAtten === "number" ? divide10(flaw.nAtten, 1) : "";

    const data: ChannelData = {
      name: chNameMap.get(key) || "",
      zsj,
      bc,
      jy,
      ts: calcTs(bc, jy),
      flaws: calcFlaws(
        chFlaws.map((flaw) => ({
          ...flaw,
          nBoard: flaw.nBoard || 0,
          nChannel: flaw.nChannel || 0,
          fltValueX: flaw.fltValueX || 0,
          nAtten: flaw.nAtten || 0,
        })),
        flaw.nChannel || 0,
      ),
    };

    map.set(key, data);
  }

  return map;
};

export const Component = () => {
  const params = useParams();
  const query = useQuery(fetchQT501(params.id!));

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

    const {
      record,
      flaws,
      FACTORY_CLD,
      FACTORY_SBBH,
      FACTORY_SBXH,
      jpegs,
      channels,
    } = query.data;

    const map = resolveFlaws(flaws, channels);

    return (
      <CHR501
        zh={record.szZh || ""}
        zx={record.szWhModel || ""}
        factoryName={FACTORY_CLD || ""}
        validateAt={record.tmNow || ""}
        equipmentModel={FACTORY_SBXH || ""}
        equipmentNo={FACTORY_SBBH || ""}
        imageLXH={jpegs.lxh}
        imageRXH={jpegs.rxh}
        imageLLZ={jpegs.llz}
        imageRLZ={jpegs.rlz}
        imageLCT={jpegs.lct}
        imageRCT={jpegs.rct}
        user={record.szUsername || ""}
        boardDatas={map}
      />
    );
  };

  return renderQuery();
};
