import { useUploadCHR503 } from "#renderer/api/kh";
import { fetchAnniversary } from "#renderer/api/mdb";
import { Loading, PendingIcon } from "#renderer/components/Loading";
import { Grid3x3, Refresh, Upload } from "@mui/icons-material";
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
import { toast } from "react-toastify";

interface UploadItemProps {
  id: string;
  children?: React.ReactNode;
}

const UploadItem = (props: UploadItemProps) => {
  const upload = useUploadCHR503();

  return (
    <ListItemButton
      onClick={() => {
        upload.mutate(props.id, {
          onError: (error) => {
            toast.error(error.message);
          },
          onSuccess: () => {
            toast.success("校验记录已上传");
          },
        });
      }}
      disabled={upload.isPending}
    >
      {props.children}
      <PendingIcon isPending={upload.isPending}>
        <Upload />
      </PendingIcon>
    </ListItemButton>
  );
};

export const Component = () => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageSize = 20;

  const query = useQuery(fetchAnniversary({ pageIndex, pageSize }));

  const renderRow = () => {
    if (query.isPending) {
      return <Loading slotProps={{ box: { sx: { padding: 0 } } }} />;
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
          <UploadItem key={row.id} id={row.id}>
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
          </UploadItem>
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
