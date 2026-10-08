import { fetchCHR53AData } from "#renderer/api/printer";
import { Loading } from "#renderer/components/Loading";
import { CHR53A } from "#renderer/components/pdf/53a";
import { Alert, AlertTitle } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router";

export const Component = () => {
  const location = useLocation();
  const ids = location.state.ids;
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
