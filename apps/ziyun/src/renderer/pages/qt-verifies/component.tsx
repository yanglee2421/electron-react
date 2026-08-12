import { fetchQTVerifies } from "#renderer/api/qt";
import { Loading } from "#renderer/components/Loading";
import { Alert, AlertTitle, Button } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

export const Component = () => {
  const query = useQuery(fetchQTVerifies());

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Alert severity="error">
          <AlertTitle>数据加载失败</AlertTitle>
          {query.error.message}
          <div></div>
          <Button
            component={Link}
            to={{ pathname: "/" }}
            variant="contained"
            color="error"
            sx={{ mt: 1 }}
          >
            回到首页
          </Button>
        </Alert>
      );
    }

    return null;
  };

  return <>{renderQuery()}</>;
};