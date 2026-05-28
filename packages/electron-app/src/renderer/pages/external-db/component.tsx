import { fetchExternalDBTest } from "#renderer/api/external-db";
import { Loading } from "#renderer/components/Loading";
import { Refresh } from "@mui/icons-material";
import { Alert, AlertTitle, Box, Button } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

export const Component = () => {
  const query = useQuery(fetchExternalDBTest());

  if (query.isPending) {
    return <Loading />;
  }

  if (query.isError) {
    return (
      <Alert severity="error" variant="outlined">
        <AlertTitle>加载失败</AlertTitle>
        <Box sx={{ pb: 1 }}>{query.error.message}</Box>
        <Button
          color="error"
          variant="contained"
          startIcon={<Refresh />}
          onClick={() => {
            query.refetch();
          }}
          disabled={query.isRefetching}
        >
          重试
        </Button>
      </Alert>
    );
  }

  return (
    <ul>
      {query.data.map((item) => {
        return <li key={item.recId}>{item.yqName}</li>;
      })}
    </ul>
  );
};
