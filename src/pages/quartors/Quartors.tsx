import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  TableCellProps,
  Typography,
  Grid2,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { fetchQuartors, Quartor } from "./fetchQuartors";
import React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";

const paddMap = new Map<string, TableCellProps["padding"]>();
paddMap.set("checkbox", "checkbox");

const columnHelper = createColumnHelper<Quartor>();
const columns = [
  columnHelper.display({
    id: "checkbox",
    header(props) {
      return (
        <Checkbox
          checked={props.table.getIsAllRowsSelected()}
          onChange={props.table.getToggleAllRowsSelectedHandler()}
          indeterminate={props.table.getIsSomePageRowsSelected()}
        />
      );
    },
    cell(props) {
      return (
        <Checkbox
          checked={props.row.getIsSelected()}
          onChange={props.row.getToggleSelectedHandler()}
        />
      );
    },
  }),
  columnHelper.accessor("szIDs", {}),
  columnHelper.accessor("szIDsWheel", {}),
  columnHelper.accessor("szWHModel", {}),
  columnHelper.accessor("szUsername", {}),
  columnHelper.accessor("szIDsMake", {}),
  columnHelper.accessor("szIDsFirst", {}),
  columnHelper.accessor("szIDsLast", {}),
  columnHelper.accessor("szTMMake", {}),
  columnHelper.accessor("szTMFirst", {}),
  columnHelper.accessor("szTMLast", {}),
  columnHelper.accessor("ftRadiu", {}),
  columnHelper.accessor("bFlaws", {}),
  columnHelper.accessor("bWheelLS", {}),
  columnHelper.accessor("bWheelRS", {}),
  columnHelper.accessor("bSickLD", {}),
  columnHelper.accessor("bSickRD", {}),
  columnHelper.accessor("tmnow", {}),
  columnHelper.accessor("szResult", {}),
  columnHelper.accessor("szMemo", {}),
  columnHelper.accessor("DB", {}),
  columnHelper.accessor("bJiXiaoReportOut", {}),
  columnHelper.accessor("bHeGe", {}),
  columnHelper.accessor("startTime", {}),
  columnHelper.accessor("endTime", {}),
];

const checkDate = (day: null | dayjs.Dayjs, date: string | null) => {
  if (!day) return true;
  if (!date) return true;

  return day.toDate().toDateString() === dayjs(date).toDate().toDateString();
};

export const Quartors = () => {
  const query = useQuery({ ...fetchQuartors(), refetchInterval: 1000 * 2 });
  const [date, setDate] = React.useState<dayjs.Dayjs | null>(null);
  const data = React.useMemo(
    () => query.data?.data.rows.filter((i) => checkDate(date, i.tmnow)) || [],
    [query.data, date]
  );

  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns,
    data,
    getRowId: (r) => r.szIDs,

    getPaginationRowModel: getPaginationRowModel(),
    rowCount: data.length,

    initialState: {
      columnVisibility: {
        szMemo: false,
      },
      pagination: { pageSize: 20 },
    },
  });

  console.log(query.data);

  const renderBody = () => {
    if (query.isPending) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <Typography sx={{ textAlign: "center" }}>Loading...</Typography>
          </TableCell>
        </TableRow>
      );
    }

    if (query.isError) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <Typography sx={{ textAlign: "center" }} color="error">
              Error
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    if (!table.getRowCount()) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <Typography sx={{ textAlign: "center" }}>No Data</Typography>
          </TableCell>
        </TableRow>
      );
    }

    return table.getRowModel().rows.map((r) => (
      <TableRow key={r.id}>
        {r.getVisibleCells().map((c) => (
          <TableCell key={c.id} padding={paddMap.get(c.column.id)}>
            {c.getIsPlaceholder() ||
              flexRender(c.column.columnDef.cell, c.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <Card>
      <CardHeader title="Quartors" action={<></>} />
      <CardContent>
        <Grid2 container spacing={6}>
          <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <DatePicker
              value={date}
              onChange={setDate}
              slotProps={{ field: { clearable: true } }}
            />
          </Grid2>
        </Grid2>
      </CardContent>
      <TableContainer>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableCell key={h.id} padding={paddMap.get(h.column.id)}>
                    {h.isPlaceholder ||
                      flexRender(h.column.columnDef.header, h.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component={"div"}
        page={table.getState().pagination.pageIndex}
        rowsPerPage={table.getState().pagination.pageSize}
        count={table.getRowCount()}
        onPageChange={(e, idx) => {
          void e;
          table.setPageIndex(idx);
        }}
        onRowsPerPageChange={(e) => {
          table.setPageSize(Number.parseInt(e.target.value));
        }}
        rowsPerPageOptions={[20, 50, 100]}
      />
    </Card>
  );
};
