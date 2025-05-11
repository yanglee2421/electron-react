import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import {
  AddOutlined,
  ClearAllOutlined,
  DeleteOutlined,
  RemoveOutlined,
} from "@mui/icons-material";
import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Log } from "@/lib/db";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cellPaddingMap, rowsPerPageOptions } from "@/lib/constants";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

const columnHelper = createColumnHelper<Log>();

const columns = [
  columnHelper.display({
    id: "expand",
    cell: ({ row }) => (
      <IconButton onClick={row.getToggleExpandedHandler()}>
        {!row.getIsExpanded() ? <RemoveOutlined /> : <AddOutlined />}
      </IconButton>
    ),
  }),
  columnHelper.accessor("id", {
    cell: ({ getValue }) => <Link>#{getValue()}</Link>,
    header: "ID",
    footer: "ID",
  }),
  columnHelper.accessor("date", {
    cell: ({ getValue }) => new Date(getValue()).toLocaleString(),
    header: "日期",
    footer: "日期",
  }),
  columnHelper.accessor("type", {
    cell: ({ getValue }) => (
      <Chip label={getValue()} sx={{ textTransform: "uppercase" }} />
    ),
    header: "类型",
    footer: "类型",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <>
        <IconButton
          onClick={() => {
            db.log.delete(row.getValue("id"));
          }}
        >
          <DeleteOutlined color="error" />
        </IconButton>
      </>
    ),
    header: "操作",
    footer: "操作",
  }),
];

const initDayjs = () => dayjs();

export const Component = () => {
  "use no memo";
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);
  const [startDate, setStartDate] = React.useState(initDayjs);
  const [endDate, setEndDate] = React.useState(initDayjs);

  const logs = useLiveQuery(
    () =>
      db.log
        .where("date")
        .between(
          startDate.startOf("day").toISOString(),
          endDate.endOf("day").toISOString(),
          true,
          true,
        )
        .reverse()
        .offset(pageIndex * pageSize)
        .limit(pageSize)
        .toArray(),
    [pageIndex, pageSize, startDate, endDate],
  );

  const count = useLiveQuery(() => db.log.count(), []);
  const data = React.useMemo(() => logs || [], [logs]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id.toString(),
    rowCount: count,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  const renderRow = () => {
    if (!table.getRowCount()) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            暂无数据
          </TableCell>
        </TableRow>
      );
    }

    return table.getRowModel().rows.map((row) => (
      <React.Fragment key={row.id}>
        <TableRow>
          {row.getVisibleCells().map((cell) => (
            <TableCell
              key={cell.id}
              padding={cellPaddingMap.get(cell.column.id)}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
        {row.getIsExpanded() || (
          <TableRow>
            <TableCell colSpan={table.getAllLeafColumns().length}>
              {row.original.message}
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    ));
  };

  return (
    <Card>
      <CardHeader
        title="日志"
        action={
          <IconButton
            onClick={() => {
              db.log.clear();
            }}
          >
            <ClearAllOutlined />
          </IconButton>
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
        </Grid>
      </CardContent>
      <TableContainer>
        <Table sx={{ minWidth: 720 }}>
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
                      header.getContext(),
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
                      header.getContext(),
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
        page={pageIndex}
        count={table.getRowCount()}
        rowsPerPage={pageSize}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={(e, page) => {
          void e;
          setPageIndex(page);
        }}
        onRowsPerPageChange={(e) => {
          setPageSize(Number.parseInt(e.target.value, 10));
        }}
        labelRowsPerPage="每页行数"
      />
    </Card>
  );
};
