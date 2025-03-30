import {
  Alert,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Menu,
} from "@mui/material";
import {
  RefreshOutlined,
  MoreVertOutlined,
  CloudUploadOutlined,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import { useSnackbar } from "notistack";
import { fetchVerifies, useUploadVerifies } from "./fetchers";
import { useIndexedStore } from "@/hooks/useIndexedStore";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getPaginationRowModel,
} from "@tanstack/react-table";
import type { Verify } from "@/api/database_types";
import { cellPaddingMap, rowsPerPageOptions } from "@/lib/utils";
import { DATE_FORMAT } from "@/lib/constants";

type ActionCellProps = {
  id: string;
};

const ActionCell = (props: ActionCellProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const snackbar = useSnackbar();
  const uploadVerifies = useUploadVerifies();
  const settings = useIndexedStore((s) => s.settings);
  const hmis = useIndexedStore((s) => s.hxzy_hmis);

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertOutlined />
      </IconButton>
      <Menu open={!!anchorEl} onClose={handleClose} anchorEl={anchorEl}>
        <MenuItem
          onClick={() => {
            uploadVerifies.mutate(
              {
                driverPath: settings.driverPath,
                databasePath: settings.databasePath,
                id: props.id,
                host: hmis.host,
              },
              {
                onError: (error) => {
                  snackbar.enqueueSnackbar(error.message, { variant: "error" });
                },
                onSuccess: (data) => {
                  snackbar.enqueueSnackbar("上传成功", { variant: "success" });
                  console.log(data);
                  handleClose();
                },
              }
            );
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

const initDate = () => dayjs();

const columnHelper = createColumnHelper<Verify>();

const columns = [
  columnHelper.accessor("szIDs", { header: "ID", footer: "ID" }),
  columnHelper.accessor("szIDsWheel", { header: "轴号", footer: "轴号" }),
  columnHelper.accessor("szWHModel", { header: "轴型", footer: "轴型" }),
  columnHelper.accessor("szUsername", { header: "检测员", footer: "检测员" }),
  columnHelper.accessor("tmNow", {
    header: "时间",
    footer: "时间",
    cell: ({ getValue }) => {
      const tmnow = getValue();
      if (!tmnow) return null;

      return new Date(tmnow).toLocaleString();
    },
  }),
  columnHelper.accessor("szResult", { header: "检测结果", footer: "检测结果" }),
  columnHelper.display({
    id: "actions",
    header: "操作",
    footer: "操作",
    cell: ({ row }) => <ActionCell id={row.getValue("szIDs")} />,
  }),
];

export const Component = () => {
  const [date, setDate] = React.useState(initDate);

  const settings = useIndexedStore((s) => s.settings);

  const sql = `SELECT * FROM verifies WHERE tmnow BETWEEN #${date
    .startOf("day")
    .format(DATE_FORMAT)}# AND #${date.endOf("day").format(DATE_FORMAT)}#`;

  const query = useQuery(
    fetchVerifies({
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
        title="华兴致远日常校验"
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
        <Grid container spacing={6}>
          <Grid size={12}>
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
          </Grid>
        </Grid>
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
                      header.column.columnDef.footer,
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
