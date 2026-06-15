import { fetchLog, useClearLog, useDeleteLog } from "#renderer/api/logger";
import { ScrollToTopButton } from "#renderer/components/scroll";
import { useColorScheme } from "#renderer/hooks/dom/useColorScheme";
import { ClearAllOutlined, Delete, Refresh } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  MenuItem,
  Pagination,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import { codeToHtml } from "shiki";

const initDayjs = () => dayjs();

const CodeBlock = ({ code }: { code: string }) => {
  const isDark = useColorScheme();

  const codeQuery = useQuery({
    queryKey: ["code", code, isDark],
    queryFn: async () => {
      return codeToHtml(JSON.stringify(JSON.parse(code), null, 2), {
        lang: "json",
        theme: isDark ? "dark-plus" : "light-plus",
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
          fontSize: "20px",
          fontFamily: "Consolas, 'Courier New', monospace",
        },
      }}
      dangerouslySetInnerHTML={{
        __html: codeQuery.data,
      }}
    ></Box>
  );
};

interface DeleteButtonProps {
  id: number;
}

const DeleteButton = ({ id }: DeleteButtonProps) => {
  const deleteLog = useDeleteLog();

  return (
    <IconButton
      onClick={() => {
        deleteLog.mutate(id);
      }}
      disabled={deleteLog.isPending}
    >
      <Delete />
    </IconButton>
  );
};

export const Component = () => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize] = React.useState(20);
  const [level, setLevel] = React.useState("all");
  const [startDate, setStartDate] = React.useState(initDayjs);
  const [endDate, setEndDate] = React.useState(initDayjs);

  const clearLogs = useClearLog();
  const logQuery = useQuery(
    fetchLog({
      pageIndex,
      pageSize,
      startDate: dayjs(startDate).startOf("day").toISOString(),
      endDate: dayjs(endDate).endOf("day").toISOString(),
      level: level === "all" ? void 0 : level,
    }),
  );

  const renderLogs = () => {
    if (logQuery.isPending) {
      return <Grid size={12}>加载中...</Grid>;
    }

    if (logQuery.isError) {
      return <Grid size={12}>{logQuery.error.message}</Grid>;
    }

    if (logQuery.data.rows.length === 0) {
      return <Grid size={12}>暂无日志</Grid>;
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
                  action={<DeleteButton id={log.id} />}
                />
                <CardContent
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {log.message}
                </CardContent>
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
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="级别"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <MenuItem value="all">全部</MenuItem>
              <MenuItem value="log">信息</MenuItem>
              <MenuItem value="error">错误</MenuItem>
            </TextField>
          </Grid>
          <Grid size={12}>
            <Pagination
              page={pageIndex + 1}
              count={Math.ceil((logQuery.data?.count || 0) / pageSize)}
              onChange={(_, page) => {
                setPageIndex(page - 1);
              }}
            />
          </Grid>
          {renderLogs()}
        </Grid>
      </CardContent>
    </Card>
  );
};
