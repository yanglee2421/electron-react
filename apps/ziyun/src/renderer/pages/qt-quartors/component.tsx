import { fetchQTQuartors } from "#renderer/api/qt";
import { Loading, PendingIcon } from "#renderer/components/Loading";
import { ScrollToTopButton } from "#renderer/components/scroll";
import { useDayjs } from "#renderer/hooks/use-dayjs";
import { cellPaddingMap, rowsPerPageOptions } from "#renderer/lib/constants";
import { Print, Refresh } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { schema } from "@yanglee2421/external-db";
import dayjs from "dayjs";
import React from "react";
import { useNavigate } from "react-router";

type Row = typeof schema.quartors.$inferSelect;

const columnHelper = createColumnHelper<Row>();
const columns = [
  columnHelper.display({
    id: "checkbox",
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        indeterminate={table.getIsSomeRowsSelected()}
      />
    ),
    footer: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        indeterminate={table.getIsSomeRowsSelected()}
      />
    ),
  }),
  columnHelper.accessor("szIds", {
    header: "ID",
    cell: ({ getValue }) => getValue()?.slice(-6),
  }),
  columnHelper.accessor("szWhModel", {
    header: "轴型",
  }),
  columnHelper.accessor("szUsername", {
    header: "检测员",
  }),
  columnHelper.accessor("tmNow", {
    header: "时间",
  }),
];

interface TT {
  disabledPrint: boolean;
  subheader?: React.ReactNode;
}

const calcPrintCheck = (...args: Row[]): TT => {
  if (args.length !== 5) {
    return { disabledPrint: true, subheader: "选中的行数必须为5" };
  }

  let date = "";
  let user = "";
  let zx = "";

  for (const row of args) {
    date ||= dayjs(row.tmNow).format("YYYY-MM-DD");
    user ||= row.szUsername || "";
    zx ||= row.szWhModel || "";

    const isSameDate = dayjs(row.tmNow).format("YYYY-MM-DD") === date;

    if (!isSameDate) {
      return {
        disabledPrint: true,
        subheader: "选中的数据必须是同一天的",
      };
    }

    const isSameUser = row.szUsername === user;

    if (!isSameUser) {
      return {
        disabledPrint: true,
        subheader: "选中的数据必须是同一个检测员的",
      };
    }

    const isSameZX = row.szWhModel === zx;

    if (!isSameZX) {
      return {
        disabledPrint: true,
        subheader: "选中的数据必须是同一轴型的",
      };
    }
  }

  return {
    disabledPrint: false,
    subheader: `选中了${args.length}行，检测日期为${date}，检测员为${user}`,
  };
};

export const Component = () => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(100);
  const [user, setUser] = React.useState("");
  const [zx, setZx] = React.useState("");
  const [day, setDay] = useDayjs();

  const navigate = useNavigate();
  const date = day?.toISOString() || "";
  const query = useQuery(
    fetchQTQuartors({ pageIndex, pageSize, user, date, zx }),
  );
  const data = React.useMemo(() => query.data?.rows || [], [query.data]);
  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns,
    data,
    getRowId: (r) => r.recId.toString(10),
    manualPagination: true,
  });

  const printCheck = calcPrintCheck(
    ...table.getSelectedRowModel().flatRows.map((row) => row.original),
  );

  const renderRow = () => {
    if (query.isPending) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            <Loading slotProps={{ box: { sx: { padding: 0 } } }} />
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
              {query.error?.message}
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

    return table.getRowModel().rows.map((row) => (
      <TableRow key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} padding={cellPaddingMap.get(cell.column.id)}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <>
      <ScrollToTopButton />
      <Card>
        <CardHeader
          title="季度校验"
          subheader={printCheck.subheader}
          action={
            <IconButton
              onClick={() => {
                query.refetch();
              }}
              disabled={query.isRefetching}
            >
              <PendingIcon isPending={query.isRefetching}>
                <Refresh />
              </PendingIcon>
            </IconButton>
          }
        />
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                value={day}
                onChange={(e) => {
                  setDay(e);
                }}
                slotProps={{
                  textField: { fullWidth: true },
                  field: { clearable: true },
                }}
                label="日期"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                }}
                fullWidth
                label="检测员"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                value={zx}
                onChange={(e) => {
                  setZx(e.target.value);
                }}
                fullWidth
                label="轴型"
              />
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardContent>
          <Button
            disabled={printCheck.disabledPrint}
            startIcon={<Print />}
            variant="outlined"
            onClick={() => {
              const search = new URLSearchParams();

              table.getSelectedRowModel().flatRows.forEach((row) => {
                search.append("row", row.id);
              });

              navigate({
                pathname: "/qt/quartors/502",
                search: "?" + search.toString(),
              });
            }}
          >
            打印
          </Button>
        </CardContent>
        {query.isFetching && <LinearProgress />}
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
          count={query.data?.count || 0}
          rowsPerPage={pageSize}
          rowsPerPageOptions={rowsPerPageOptions}
          onPageChange={(_, page) => {
            setPageIndex(page);
          }}
          onRowsPerPageChange={(e) => {
            setPageSize(Number.parseInt(e.target.value, 10));
          }}
          labelRowsPerPage="每页行数"
        />
      </Card>
    </>
  );
};
