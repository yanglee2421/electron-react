import { fetchCHR501Data } from "#renderer/api/printer";

import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { useParams } from "react-router";
import { PrintCHR501 } from "./PrintCHR501";

export const Component = () => {
  const params = useParams();
  const query = useQuery(fetchCHR501Data(params.id!));

  const renderQuery = () => {
    if (query.isPending) {
      return <div>加载中...</div>;
    }

    if (query.isError) {
      return <div>加载失败: {(query.error as Error).message}</div>;
    }

    return <PrintCHR501 />;
  };

  return (
    <>
      <Box>{renderQuery()}</Box>
    </>
  );
};
