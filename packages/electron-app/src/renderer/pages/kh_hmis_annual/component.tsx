import type { QuartorYearlyData } from "#main/modules/mdb";
import { fetchDataFromRootDB } from "#renderer/api/fetch_preload";
import { useUploadCHR503 } from "#renderer/api/kh";
import { createNChannelGroup } from "#shared/functions/flawDetection";
import { Refresh, Upload, WifiChannel } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useQuery } from "@tanstack/react-query";
import { useNotifications } from "@toolpad/core";
import { mapGroupBy } from "@yotulee/run";
import dayjs from "dayjs";
import React from "react";

const dateInitializer = () => {
  return new Date().toISOString();
};

const calculateFilters = (beginDate: string, endDate: string) => {
  if (!beginDate) {
    return [];
  }

  if (!endDate) {
    return [];
  }

  return [
    {
      type: "date" as const,
      field: "tmNow",
      startAt: dayjs(beginDate).startOf("day").toISOString(),
      endAt: dayjs(endDate).endOf("day").toISOString(),
    },
  ];
};

const calculateChipLabel = (channel: string) => {
  const channelNumber = channel.replaceAll(/[^\d]/g, "");

  if (Number(channelNumber) < 10) {
    return "通道0" + channelNumber;
  }

  return "通道" + channelNumber;
};

export const Component = () => {
  const [beginDate, setBeginDate] = React.useState(dateInitializer);
  const [endDate, setEndDate] = React.useState(dateInitializer);

  const uploadCHR503 = useUploadCHR503();
  const notification = useNotifications();

  const query = useQuery(
    fetchDataFromRootDB<QuartorYearlyData>({
      tableName: "Quartor",
      filters: calculateFilters(beginDate, endDate),
    }),
  );

  const groups = mapGroupBy(query.data?.rows ?? [], (row) => row.szIDs);

  return (
    <Card>
      <CardHeader
        title="年度校验"
        action={
          <IconButton
            onClick={() => {
              void query.refetch();
            }}
            disabled={query.isRefetching}
          >
            <Refresh />
          </IconButton>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid>
            <DatePicker
              value={beginDate ? dayjs(beginDate) : null}
              onChange={(day) => {
                setBeginDate(day ? day.toISOString() : "");
              }}
              maxDate={endDate ? dayjs(endDate) : void 0}
              slotProps={{
                textField: {
                  label: "开始日期",
                  fullWidth: true,
                },
                field: {
                  clearable: true,
                },
              }}
            />
          </Grid>
          <Grid>
            <DatePicker
              value={endDate ? dayjs(endDate) : null}
              onChange={(day) => {
                setEndDate(day ? day.toISOString() : "");
              }}
              minDate={beginDate ? dayjs(beginDate) : void 0}
              slotProps={{
                textField: {
                  label: "结束日期",
                  fullWidth: true,
                },
                field: {
                  clearable: true,
                },
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
      {query.isFetching && <LinearProgress />}
      <CardContent>
        <Grid container spacing={3}>
          {Array.from(groups, ([key, rows]) => {
            const group = createNChannelGroup(rows);

            return (
              <Grid size={{ xs: 12, md: 6 }} key={key}>
                <Card variant="outlined">
                  <CardHeader
                    title={key}
                    action={
                      <IconButton
                        onClick={() => {
                          uploadCHR503.mutate(key, {
                            onError: (error) => {
                              notification.show(error.message, {
                                severity: "error",
                              });
                            },
                            onSuccess: () => {
                              notification.show("上传成功", {
                                severity: "success",
                              });
                            },
                          });
                        }}
                      >
                        <Upload />
                      </IconButton>
                    }
                  />
                  <Divider />
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1.5,
                      }}
                    >
                      {Array.from(
                        Object.entries(group),
                        ([channel, [data]]) => {
                          return (
                            <Chip
                              key={channel}
                              label={calculateChipLabel(channel)}
                              variant="outlined"
                              color={data.bResult ? "success" : "error"}
                              icon={<WifiChannel />}
                              size="medium"
                              sx={{ flexGrow: 1 }}
                            />
                          );
                        },
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};
