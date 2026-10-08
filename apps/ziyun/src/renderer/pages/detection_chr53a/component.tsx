import { fetchCHR53AData } from "#renderer/api/printer";
import { Loading } from "#renderer/components/Loading";
import { CHR53A } from "#renderer/components/pdf/53a";
import { useSessionStore } from "#renderer/hooks/use-session-store";
import { Alert, AlertTitle } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

export const Component = () => {
  const ids = useSessionStore((s) => s.mdb53aIds);
  const query = useQuery(fetchCHR53AData({ ids }));

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

    const { records, corporation } = query.data;
    const firstRow = records.at(0);

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
        factory={corporation.Factory || ""}
        user={firstRow.szUsername || ""}
        date={firstRow.tmnow || ""}
        records={records}
      />
    );
  };

  return renderQuery();
};
