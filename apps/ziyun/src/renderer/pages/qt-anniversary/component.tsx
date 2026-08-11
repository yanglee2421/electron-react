import { fetchExternalDBAnniversary } from "#renderer/api/qt";
import { Loading } from "#renderer/components/Loading";
import { ArrowForward, Grid3x3, Refresh } from "@mui/icons-material";
import {
  Card,
  CardContent,
  CardHeader,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Pagination,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import { Link } from "react-router";

export const Component = () => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageSize = 20;

  const query = useQuery(fetchExternalDBAnniversary({ pageIndex, pageSize }));

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return <>{query.error.message}</>;
    }

    return (
      <List>
        {query.data.rows.map((item) => (
          <ListItemButton
            key={item.recId}
            component={Link}
            to={{ pathname: `/qt/anniversary/${item.recId}` }}
          >
            <ListItemIcon>
              <Grid3x3 />
            </ListItemIcon>
            <ListItemText
              primary={item.recId}
              secondary={
                item.recId
                  ? dayjs(item.date).format("YYYY年MM月DD日 HH:mm:ss")
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
      <CardContent>
        <Pagination
          count={Math.ceil((query.data?.count || 0) / pageSize)}
          page={pageIndex + 1}
          onChange={(_, page) => {
            setPageIndex(page - 1);
          }}
          variant="outlined"
        />
        {renderQuery()}
      </CardContent>
    </Card>
  );
};

// 0-8 左 9-F左
// 111 1*16 + 1=17 1=裂纹|2=透声不良|3=晶粗|4=压装不良
//
// 011 021 041 051 921 941 951

// 0穿透
// 1卸荷槽
// 2 a3
// 3 51
// 4 44
