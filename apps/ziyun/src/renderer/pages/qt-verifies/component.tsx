import { fetchQTUsers, fetchQTVerifies } from "#renderer/api/qt";
import { Loading, PendingIcon } from "#renderer/components/Loading";
import { ScrollToTopButton } from "#renderer/components/scroll";
import { useDayjs } from "#renderer/hooks/use-dayjs";
import { cellPaddingMap, rowsPerPageOptions } from "#renderer/lib/constants";
import { Refresh } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Link,
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
import React from "react";
import { Link as RouterLink } from "react-router";

type Row = typeof schema.verifies.$inferSelect;

const columnHelper = createColumnHelper<Row>();
const columns = [
  columnHelper.accessor("szIds", {
    header: "ID",
    cell: ({ getValue }) => {
      const value = getValue();

      return (
        <Link
          component={RouterLink}
          to={{ pathname: `/qt/verifies/${value}/501` }}
        >
          #{value?.slice(-6)}
        </Link>
      );
    },
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

export const Component = () => {
  "use no memo";
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(100);
  const [user, setUser] = React.useState("");
  const [zx, setZx] = React.useState("");
  const [day, setDay] = useDayjs();

  const date = day?.toISOString() || "";
  const query = useQuery(
    fetchQTVerifies({ pageIndex, pageSize, user, zx, date }),
  );
  const data = React.useMemo(() => query.data?.rows || [], [query.data]);
  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns,
    data,
    getRowId: (r) => r.recId.toString(10),
    manualPagination: true,
  });

  const users = useQuery(fetchQTUsers());

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
          title="日常校验"
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
                onChange={(e) => setDay(e)}
                slotProps={{
                  textField: { fullWidth: true },
                  field: { clearable: true },
                }}
                label="日期"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                value={user}
                onChange={(_, value) => {
                  setUser(value || "");
                }}
                renderInput={(p) => <TextField {...p} label="检测员" />}
                options={users.data ? users.data.rows.map((r) => r.name) : []}
                freeSolo
                fullWidth
                loading={users.isPending}
                loadingText="加载中"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                value={zx}
                onChange={(_, value) => {
                  setZx(value || "");
                }}
                renderInput={(p) => <TextField {...p} label="轴型" />}
                options={["RE2B", "RD2"]}
                freeSolo
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
        {query.isFetching ? <LinearProgress /> : <Divider />}
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
