import { fetchCHR501Data } from "#renderer/api/printer";
import { Loading } from "#renderer/components/Loading";
import { of } from "#shared/functions/array";
import { resolveCHR501 } from "#shared/functions/chr501";
import { Print } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

export const Component = () => {
  const params = useParams();
  const query = useQuery(fetchCHR501Data(params.id!));

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

    const { datas, detectors } = query.data;
    const { flawInfo } = resolveCHR501(datas, detectors);

    return (
      <Grid container spacing={1}>
        <Grid size={12}>
          <Card>
            <CardHeader title="数据加载成功" />
            <CardContent>
              <Button
                startIcon={<Print />}
                component={Link}
                to={`/verify/${params.id}/chr501`}
                variant="outlined"
              >
                打印
              </Button>
            </CardContent>
          </Card>
        </Grid>
        {of(2).map((_, board) => {
          const direction = board === 0 ? "左" : "右";

          return (
            <Grid size={6} key={board}>
              <Card>
                <CardHeader title={direction} />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>探测部位</TableCell>
                        <TableCell>探头号</TableCell>
                        <TableCell>疑似裂纹个数</TableCell>
                        <TableCell>距端面距</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>穿透</TableCell>
                        <TableCell>{direction}穿透</TableCell>
                        <TableCell>
                          {flawInfo.get(`${board}-0`)?.length}裂纹
                        </TableCell>
                        <TableCell>
                          {flawInfo
                            .get(`${board}-0`)
                            ?.map((flaw) => flaw.value)
                            .join(", ")}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>卸荷槽</TableCell>
                        <TableCell>{direction}卸荷槽</TableCell>
                        <TableCell>
                          {flawInfo.get(`${board}-1`)?.length}裂纹
                        </TableCell>
                        <TableCell
                          sx={{ textWrap: "wrap", whiteSpace: "normal" }}
                        >
                          {flawInfo
                            .get(`${board}-1`)
                            ?.map((flaw) => flaw.value)
                            .join(", ")}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell rowSpan={3}>轮座</TableCell>
                        <TableCell>{direction}A03</TableCell>
                        <TableCell>
                          {flawInfo.get(`${board}-2`)?.length}裂纹
                        </TableCell>
                        <TableCell>
                          {flawInfo
                            .get(`${board}-2`)
                            ?.map((flaw) => flaw.value)
                            .join(", ")}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{direction}01</TableCell>
                        <TableCell>
                          {
                            flawInfo.get(`${board}-3`)?.filter((i) => i.value)
                              ?.length
                          }
                          裂纹
                        </TableCell>
                        <TableCell>
                          {flawInfo
                            .get(`${board}-3`)
                            ?.filter((i) => i.value)
                            ?.map((flaw) => flaw.value)
                            .join(", ")}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{direction}02</TableCell>
                        <TableCell>
                          {
                            flawInfo.get(`${board}-4`)?.filter((i) => i.value)
                              ?.length
                          }
                          裂纹
                        </TableCell>
                        <TableCell>
                          {flawInfo
                            .get(`${board}-4`)
                            ?.filter((i) => i.value)
                            ?.map((flaw) => flaw.value)
                            .join(", ")}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return renderQuery();
};
