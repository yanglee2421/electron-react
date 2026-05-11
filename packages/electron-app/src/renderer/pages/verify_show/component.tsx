import { fetchCHR501Data } from "#renderer/api/printer";
import { Print } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

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

    return (
      <>
        <Button
          startIcon={<Print />}
          component={Link}
          to={`/verify/${params.id}/chr501`}
        >
          打印
        </Button>
      </>
    );
  };

  return renderQuery();
};
