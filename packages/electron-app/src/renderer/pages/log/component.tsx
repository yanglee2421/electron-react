import { fetchLog, useClearLog, useLogUpdate } from "#renderer/api/logger";
import { ScrollToTopButton } from "#renderer/components/scroll";
import { ClearAllOutlined, Refresh } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import { codeToHtml } from "shiki";

const initDayjs = () => dayjs();

const CodeBlock = ({ code }: { code: string }) => {
  const codeQuery = useQuery({
    queryKey: ["code", code],
    queryFn: async () => {
      return codeToHtml(JSON.stringify(JSON.parse(code), null, 2), {
        lang: "json",
        theme: "dark-plus",
      });
    },
  });

  if (codeQuery.isPending) {
    return null;
  }

  if (codeQuery.isError) {
    return null;
  }

  return (
    <Box
      sx={{
        "& pre.shiki": {
          whiteSpace: "pre-wrap",
        },
      }}
      dangerouslySetInnerHTML={{
        __html: codeQuery.data,
      }}
    ></Box>
  );
};

export const Component = () => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(100);
  const [startDate, setStartDate] = React.useState(initDayjs);
  const [endDate, setEndDate] = React.useState(initDayjs);

  const clearLogs = useClearLog();
  const logQuery = useQuery(
    fetchLog({
      pageIndex,
      pageSize,
      startDate: dayjs(startDate).startOf("day").toISOString(),
      endDate: dayjs(endDate).endOf("day").toISOString(),
    }),
  );

  useLogUpdate();

  const renderLogs = () => {
    if (logQuery.isPending) {
      return <div>加载中...</div>;
    }

    if (logQuery.isError) {
      return <div>加载日志失败</div>;
    }

    if (logQuery.data.rows.length === 0) {
      return <div>暂无日志</div>;
    }

    return (
      <>
        {logQuery.data.rows
          .slice()
          .reverse()
          .map((log) => (
            <Grid size={12} key={log.id}>
              <Card variant="outlined">
                <CardHeader
                  title={log.title}
                  subheader={log.date?.toLocaleString()}
                />
                <CardContent>{log.message}</CardContent>
                {log.json && <CodeBlock code={log.json} />}
              </Card>
            </Grid>
          ))}
      </>
    );
  };

  return (
    <Card>
      <ScrollToTopButton />
      <CardHeader
        title="日志"
        action={
          <>
            <IconButton
              onClick={() => {
                void logQuery.refetch();
              }}
              disabled={logQuery.isRefetching}
            >
              <Refresh />
            </IconButton>
            <IconButton
              onClick={() => {
                clearLogs.mutate();
              }}
            >
              <ClearAllOutlined />
            </IconButton>
          </>
        }
      />
      <CardContent>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              value={startDate}
              onChange={(e) => {
                if (!e) return;
                setStartDate(e);
              }}
              maxDate={endDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  label: "起始日期",
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              value={endDate}
              onChange={(e) => {
                if (!e) return;
                setEndDate(e);
              }}
              minDate={startDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  label: "结束日期",
                },
              }}
            />
          </Grid>
          {renderLogs()}
        </Grid>
      </CardContent>
    </Card>
  );
};
