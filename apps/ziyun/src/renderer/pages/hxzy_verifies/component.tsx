import type { Verify } from "#main/features/mdb/types";
import { fetchUser, fetchVerifies } from "#renderer/api/mdb";
import { Loading } from "#renderer/components/Loading";
import { ScrollToTopButton } from "#renderer/components/scroll";
import { cellPaddingMap, rowsPerPageOptions } from "#renderer/lib/constants";
import { RefreshOutlined } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
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
import dayjs from "dayjs";
import React from "react";

const szIDToId = (szID: string) => szID.split(".").at(0)?.slice(-7);
const columnHelper = createColumnHelper<Verify>();
const columns = [
  columnHelper.accessor("szIDs", {
    header: "ID",
    footer: "ID",
    cell: ({ getValue }) => {
      const szID = getValue();

      return <Link>#{szIDToId(szID)}</Link>;
    },
  }),
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
];

export const Component = () => {
  "use no memo";
  const [date, setDate] = React.useState<dayjs.Dayjs | null>(() => dayjs());
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(100);
  const [user, setUser] = React.useState("");
  const [zx, setZx] = React.useState("");

  const userDataListId = React.useId();
  const zxDataListId = React.useId();

  const query = useQuery(
    fetchVerifies({
      pageIndex,
      pageSize,
      date: date?.toISOString() || "",
      user,
      zx,
    }),
  );

  const usersQuery = useQuery(fetchUser({ pageIndex: 0, pageSize: 1000 }));

  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns,
    data: query.data?.rows || [],
    getRowId: (row) => row.szIDs,
    manualPagination: true,
  });

  const renderUserSelect = () => {
    if (!usersQuery.isSuccess) {
      return null;
    }

    return (
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          value={user}
          onChange={(e) => {
            setUser(e.target.value);
          }}
          label="检测员"
          slotProps={{ htmlInput: { list: userDataListId } }}
        />
        <datalist id={userDataListId}>
          {usersQuery.data.rows.map((user) => (
            <option key={user.szUid} value={user.szUid}></option>
          ))}
        </datalist>
      </Grid>
    );
  };

  const renderRow = () => {
    if (query.isPending) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            <Loading slotProps={{ box: { padding: 0 } }} />
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
    <Card>
      <ScrollToTopButton />
      <CardHeader
        title="日常校验"
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
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              value={date}
              onChange={(day) => {
                setDate(day);
              }}
              slotProps={{
                textField: {
                  label: "日期",
                  fullWidth: true,
                },
                field: {
                  clearable: true,
                },
              }}
            />
          </Grid>
          {renderUserSelect()}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="轴型"
              value={zx}
              onChange={(e) => setZx(e.target.value)}
              fullWidth
              slotProps={{ htmlInput: { list: zxDataListId } }}
            />
            <datalist id={zxDataListId}>
              <option value={"RE2B"}></option>
              <option value={"RD2"}></option>
            </datalist>
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
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
        count={query.data?.count || 0}
        page={pageIndex}
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
  );
};
