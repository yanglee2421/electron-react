import { fetchQuartorById } from "#renderer/api/mdb";
import { Loading } from "#renderer/components/Loading";
import { of } from "#shared/functions/array";
import { mathFormat } from "#shared/functions/math";
import { Print, Refresh } from "@mui/icons-material";
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
  FormLabel,
  Grid,
  IconButton,
  Stack,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { chunk, mapGroupBy } from "@yotulee/run";
import { Link, useParams } from "react-router";

const resolveMetaInfo = (params: string | null) => {
  const result = new Map<string, number>();

  if (params === null) {
    return result;
  }

  const chunks = chunk(params.split(""), 8);

  for (const item of chunks) {
    const board = Number(item.at(0)) ? 1 : 0;
    const channel = item.at(1);
    const flawType = Number(item.at(-1));

    result.set(`${board}-${channel}`, flawType);
  }

  return result;
};

export const Component = () => {
  const params = useParams();
  const query = useQuery(fetchQuartorById(params.id!));

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Alert severity="error">
          <AlertTitle>数据加载失败</AlertTitle>
          {query.error.message}
        </Alert>
      );
    }

    const { datas, record } = query.data;
    const metaInfo = resolveMetaInfo(record.szMemo);
    const flawGroup = mapGroupBy(
      datas,
      (data) => `${data.nBoard}-${data.nChannel}`,
    );
    const of2 = of(2);

    const renderMetaInfo = (board: number, channel: number) => {
      const channelId = `${board}-${channel}`;
      const flawType = metaInfo.get(channelId) || 1;

      switch (flawType) {
        case 2:
          return "透声不良";
        case 4:
          return "晶粗";
        case 8:
          return "压装不良";
        case 1:
        default:
          return (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {flawGroup.get(channelId)?.map((flaw, index) => (
                <Chip
                  key={index}
                  label={mathFormat(flaw.fltValueX, {
                    precision: 0,
                    notation: "fixed",
                  })}
                  variant="outlined"
                  sx={{ flexGrow: 0 }}
                />
              ))}
            </Box>
          );
      }
    };

    return (
      <Card>
        <CardHeader
          title="校验记录详情"
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
          <Button
            startIcon={<Print />}
            component={Link}
            to={`/quartors/${params.id}/chr501`}
            variant="outlined"
          >
            打印
          </Button>
        </CardContent>
        <Divider></Divider>
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={12}>
              <FormLabel>穿透</FormLabel>
            </Grid>
            {of2.map((_, board) => {
              const direction = board ? "右" : "左";

              return (
                <Grid key={_} size={{ xs: 12, sm: 6 }}>
                  <Card variant="outlined">
                    <CardHeader
                      title={`${direction}穿透`}
                      subheader={`${flawGroup.get(`${board}-0`)?.length || 0}伤`}
                    />
                    <CardContent>{renderMetaInfo(board, 0)}</CardContent>
                  </Card>
                </Grid>
              );
            })}
            <Grid size={12}>
              <FormLabel>卸荷槽</FormLabel>
            </Grid>
            {of2.map((_, board) => {
              const direction = board ? "右" : "左";

              return (
                <Grid key={_} size={{ xs: 12, sm: 6 }}>
                  <Card variant="outlined">
                    <CardHeader
                      title={`${direction}A1`}
                      subheader={`${flawGroup.get(`${board}-1`)?.length || 0}伤`}
                    />
                    <CardContent>{renderMetaInfo(board, 1)}</CardContent>
                  </Card>
                </Grid>
              );
            })}
            <Grid size={12}>
              <FormLabel>轮座</FormLabel>
            </Grid>
            {of2.map((_, board) => {
              const direction = board ? "右" : "左";

              return (
                <Grid key={board} size={6}>
                  <Stack spacing={2}>
                    <Stack spacing={1.5}>
                      <Card variant="outlined">
                        <CardHeader
                          title={`${direction}01`}
                          subheader={`${flawGroup.get(`${board}-3`)?.length || 0}伤`}
                        />
                        <CardContent>{renderMetaInfo(board, 3)}</CardContent>
                      </Card>
                      <Card variant="outlined">
                        <CardHeader
                          title={`${direction}02`}
                          subheader={`${flawGroup.get(`${board}-4`)?.length || 0}伤`}
                        />
                        <CardContent>{renderMetaInfo(board, 4)}</CardContent>
                      </Card>
                      <Card variant="outlined">
                        <CardHeader
                          title={`${direction}A3`}
                          subheader={`${flawGroup.get(`${board}-2`)?.length || 0}伤`}
                        />
                        <CardContent>{renderMetaInfo(board, 2)}</CardContent>
                      </Card>
                    </Stack>
                  </Stack>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return renderQuery();
};
