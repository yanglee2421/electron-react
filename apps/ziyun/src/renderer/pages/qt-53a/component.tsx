import { fetchQT53A } from "#renderer/api/qt";
import { Loading } from "#renderer/components/Loading";
import { CHR53A } from "#renderer/components/pdf/53a";
import { useSessionStore } from "#renderer/hooks/use-session-store";
import { Alert, AlertTitle } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

export const Component = () => {
  const [searchParams] = useSearchParams();
  const date = searchParams.get("date") || "";
  const user = searchParams.get("user") || "";
  const ids = useSessionStore((s) => s.qt53aIds);
  const query = useQuery(fetchQT53A({ ids, date, user }));

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

    const { rows, FACTORY_CLD } = query.data;
    const firstRow = rows.at(0);

    if (!firstRow) {
      return (
        <Alert severity="info">
          <AlertTitle>空数据</AlertTitle>
          未查询到任何数据
        </Alert>
      );
    }

    return (
      <CHR53A
        records={rows.map((row) => ({
          szIDs: row.szIDs || "",
          szIDsWheel: row.szZH,
          szMemo: row.szMemo,
          szIDsFirst: row.szIDsFirst,
          szTMFirst: row.szTMFirst,
          szResult: row.szResult,
          szWHModel: row.szWHModel,
          bWheelLS: !!row.bWheelLS,
          bWheelRS: !!row.bWheelRS,
        }))}
        factory={FACTORY_CLD || ""}
        user={firstRow.szUsername || ""}
        date={firstRow.tmNow || ""}
      />
    );
  };

  return renderQuery();
};
