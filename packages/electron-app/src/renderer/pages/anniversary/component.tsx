import { fetchAnniversary } from "#renderer/api/mdb";
import { Loading } from "#renderer/components/Loading";
import { ArrowForward, Grid3x3, Refresh } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Pagination,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import { Link } from "react-router";

export const Component = () => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageSize = 20;

  const query = useQuery(fetchAnniversary({ pageIndex, pageSize }));

  const renderRow = () => {
    if (query.isPending) {
      return <Loading slotProps={{ box: { padding: 0 } }} />;
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
      <List>
        {rows.map((row) => (
          <ListItemButton
            key={row.id}
            component={Link}
            to={`/anniversary/${row.id}`}
          >
            <ListItemIcon>
              <Grid3x3 />
            </ListItemIcon>
            <ListItemText
              primary={row.id}
              secondary={
                row.rows.at(0)?.tmNow
                  ? dayjs(row.rows.at(0)?.tmNow).format(
                      "YYYY年MM月DD日 HH:mm:ss",
                    )
                  : null
              }
            />
            <ArrowForward />
          </ListItemButton>
        ))}
      </List>
    );
  };

  return (
    <Card>
      <CardHeader
        title="年度校验"
        action={
          <IconButton
            onClick={() => query.refetch()}
            disabled={query.isRefetching}
          >
            <Refresh />
          </IconButton>
        }
      />
      {query.isFetching && <LinearProgress />}
      <CardContent>
        <Pagination
          count={Math.ceil((query.data?.count || 0) / pageSize)}
          page={pageIndex + 1}
          onChange={(_, page) => {
            setPageIndex(page - 1);
          }}
          variant="outlined"
        />
        {renderRow()}
      </CardContent>
    </Card>
  );
};
