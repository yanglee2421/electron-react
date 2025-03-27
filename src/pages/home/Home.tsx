import {
  Alert,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  Grid2,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import { fetchDetections, useUploadById } from "./fetchers";
import { useIndexedStore } from "@/hooks/useIndexedStore";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getPaginationRowModel,
} from "@tanstack/react-table";
import type { Detection } from "@/api/database_types";
import { cellPaddingMap, rowsPerPageOptions } from "@/lib/utils";
import {
  MoreVertOutlined,
  RefreshOutlined,
  CloudUploadOutlined,
} from "@mui/icons-material";
import { DATE_FORMAT } from "@/lib/constants";
import { useSnackbar } from "notistack";

const initDate = () => dayjs();

type ActionCellProps = {
  id: string;
};

const ActionCell = (props: ActionCellProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const uploadById = useUploadById();
  const toast = useSnackbar();

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertOutlined />
      </IconButton>
      <Menu open={!!anchorEl} onClose={handleClose} anchorEl={anchorEl}>
        <MenuItem
          onClick={() => {
            uploadById.mutate(props.id, {
              onError(error) {
                toast.enqueueSnackbar(error.message, {
                  variant: "error",
                });
              },
              onSuccess(data) {
                console.log(data);

                toast.enqueueSnackbar("上传成功", {
                  variant: "success",
                });
                handleClose();
              },
            });
          }}
        >
          <ListItemIcon>
            <CloudUploadOutlined />
          </ListItemIcon>
          <ListItemText primary="上传" />
        </MenuItem>
      </Menu>
    </>
  );
};

const columnHelper = createColumnHelper<Detection>();

const columns = [
  columnHelper.accessor("szIDs", {}),
  columnHelper.accessor("szIDsWheel", { header: "车轮编号" }),
  columnHelper.accessor("szWHModel", { header: "车轮型号" }),
  columnHelper.accessor("szUsername", { header: "检测员" }),
  columnHelper.accessor("tmnow", {
    header: "检测时间",
    cell: ({ getValue }) => {
      const tmnow = getValue();
      if (!tmnow) return null;

      return new Date(tmnow).toLocaleString();
    },
  }),
  columnHelper.accessor("szResult", { header: "检测结果" }),
  columnHelper.display({
    id: "action",
    header: "操作",
    cell: ({ row }) => <ActionCell id={row.getValue("szIDs")} />,
  }),
];

export const Home = () => {
  const [date, setDate] = React.useState(initDate);

  const settings = useIndexedStore((s) => s.settings);

  const sql = `SELECT * FROM Detections WHERE tmnow BETWEEN #${date
    .startOf("day")
    .format(DATE_FORMAT)}# AND #${date.endOf("day").format(DATE_FORMAT)}#`;

  const query = useQuery(
    fetchDetections({
      driverPath: settings.driverPath,
      databasePath: settings.databasePath,
      query: sql,
    })
  );

  const data = React.useMemo(() => query.data || [], [query.data]);

  const table = useReactTable({
    columns,
    data,
    getRowId: (row) => row.szIDs,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const renderRow = () => {
    if (query.isPending) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            加载中...
          </TableCell>
        </TableRow>
      );
    }

    if (query.isError) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <Alert severity="error" variant="filled">
              <AlertTitle>错误</AlertTitle>
              {query.error.message}
            </Alert>
          </TableCell>
        </TableRow>
      );
    }

    if (!table.getRowCount()) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            暂无数据
          </TableCell>
        </TableRow>
      );
    }

    return table.getRowModel().rows.map((row) => {
      return (
        <TableRow key={row.id}>
          {row.getVisibleCells().map((cell) => {
            return (
              <TableCell
                key={cell.id}
                padding={cellPaddingMap.get(cell.column.id)}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            );
          })}
        </TableRow>
      );
    });
  };

  return (
    <Card>
      <CardHeader
        title="现车作业"
        action={
          <IconButton
            onClick={() => query.refetch()}
            disabled={query.isRefetching}
          >
            <RefreshOutlined />
          </IconButton>
        }
      />
      <CardContent>
        <Grid2 container spacing={6}>
          <Grid2 size={12}>
            <DatePicker
              value={date}
              onChange={(day) => {
                if (!day) return;
                setDate(day);
              }}
              slotProps={{
                textField: {
                  label: "日期",
                },
              }}
            />
          </Grid2>
        </Grid2>
      </CardContent>
      <TableContainer>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    padding={cellPaddingMap.get(header.column.id)}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>{renderRow()}</TableBody>
          <TableFooter>
            {table.getFooterGroups().map((footerGroup) => (
              <TableRow key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    padding={cellPaddingMap.get(header.column.id)}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableFooter>
        </Table>
      </TableContainer>
      <TablePagination
        component={"div"}
        page={table.getState().pagination.pageIndex}
        count={table.getRowCount()}
        rowsPerPage={table.getState().pagination.pageSize}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={(e, page) => {
          void e;
          table.setPageIndex(page);
        }}
        onRowsPerPageChange={(e) => {
          table.setPageSize(Number.parseInt(e.target.value, 10));
        }}
        labelRowsPerPage="每页行数"
      />
    </Card>
  );
};
