import { fetchAnniversaryById } from "#renderer/api/mdb";
import { Loading } from "#renderer/components/Loading";
import { Close, Done, Print, Refresh } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

export const Component = () => {
  const params = useParams();
  const query = useQuery(fetchAnniversaryById(params.id!));

  const renderRow = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Alert severity="error" variant="filled">
          <AlertTitle>错误</AlertTitle>
          {query.error?.message}
        </Alert>
      );
    }

    const rows = query.data.rows;

    if (!rows.length) {
      return <Typography>暂无数据</Typography>;
    }

    return (
      <Grid container spacing={1.5}>
        {rows.map((row) => {
          const direction = row.nBoard ? "右" : "左";

          return (
            <Grid
              key={`${row.nBoard}/${row.nChannel}`}
              size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
            >
              <Card variant="outlined">
                <CardHeader title={`${direction}${row.nChannel + 1}`} />
                <CardContent>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    <Chip
                      label={"水平线性"}
                      color={row.bResultHor ? "success" : "error"}
                      icon={row.bResultHor ? <Done /> : <Close />}
                    />
                    <Chip
                      label={"分辨力"}
                      color={row.bResultDec ? "success" : "error"}
                      icon={row.bResultDec ? <Done /> : <Close />}
                    />
                    <Chip
                      label={"垂直线性"}
                      color={row.bResultVer ? "success" : "error"}
                      icon={row.bResultVer ? <Done /> : <Close />}
                    />
                    <Chip
                      label={"灵敏度余量"}
                      color={row.bResultAtt ? "success" : "error"}
                      icon={row.bResultAtt ? <Done /> : <Close />}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <>
      <Card>
        <CardHeader
          title="周年校验"
          action={
            <IconButton
              onClick={() => {
                query.refetch();
              }}
              disabled={query.isRefetching}
            >
              <Refresh />
            </IconButton>
          }
        />
        <CardContent>
          <Link to={`/anniversary/${params.id}/chr503`}>
            <Button startIcon={<Print />} variant="outlined">
              打印
            </Button>
          </Link>
        </CardContent>
        {query.isFetching ? <LinearProgress /> : <Divider />}
        <CardContent>{renderRow()}</CardContent>
      </Card>
    </>
  );
};
