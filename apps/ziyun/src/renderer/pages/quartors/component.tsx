import type { Quartor } from "#main/features/mdb/types";
import { fetchQuartor, fetchUser } from "#renderer/api/mdb";
import { Loading } from "#renderer/components/Loading";
import { ScrollToTopButton } from "#renderer/components/scroll";
import { cellPaddingMap, rowsPerPageOptions } from "#renderer/lib/constants";
import { Print, RefreshOutlined } from "@mui/icons-material";
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
import { Link as RouterLink, useNavigate } from "react-router";

const szIDToId = (szID: string) => szID.split(".").at(0)?.slice(-7);
const columnHelper = createColumnHelper<Quartor>();
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
  columnHelper.accessor("szIDs", {
    cell: ({ getValue }) => {
      const szID = getValue();
      return (
        <Link component={RouterLink} to={`/quartors/${szID}`}>
          #{szIDToId(szID)}
        </Link>
      );
    },
    header: "ID",
    footer: "ID",
  }),
  // columnHelper.accessor("szIDsWheel", { header: "轴号", footer: "轴号" }),
  columnHelper.accessor("szWHModel", { header: "轴型", footer: "轴型" }),
  columnHelper.accessor("szUsername", { header: "检测员", footer: "检测员" }),
  columnHelper.accessor("tmnow", {
    header: "时间",
    footer: "时间",
    cell: ({ getValue }) => {
      const tmnow = getValue();
      if (!tmnow) return null;

      return new Date(tmnow).toLocaleString();
    },
  }),
  // columnHelper.accessor("szResult", { header: "检测结果", footer: "检测结果" }),
];

interface TT {
  disabledPrint: boolean;
  subheader?: React.ReactNode;
}

const calcPrintCheck = (...args: Quartor[]): TT => {
  if (args.length !== 5) {
    return { disabledPrint: true, subheader: "选中的行数必须为5" };
  }

  let date = "";
  let user = "";
  let zx = "";

  for (const row of args) {
    date ||= dayjs(row.tmnow).format("YYYY-MM-DD");
    user ||= row.szUsername || "";
    zx ||= row.szWHModel || "";

    const isSameDate = dayjs(row.tmnow).format("YYYY-MM-DD") === date;

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

    const isSameZX = row.szWHModel === zx;

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
  "use no memo";

  const [date, setDate] = React.useState<dayjs.Dayjs | null>(() => dayjs());
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(100);
  const [user, setUser] = React.useState("");
  const [zx, setZX] = React.useState("");

  const userDataListId = React.useId();
  const zxDataListId = React.useId();

  const navigate = useNavigate();

  const usersQuery = useQuery(
    fetchUser({
      pageIndex: 0,
      pageSize: 999,
    }),
  );

  const query = useQuery(
    fetchQuartor({
      pageIndex,
      pageSize,
      date: date ? date.format("YYYY-MM-DD") : "",
      user,
      zx,
    }),
  );

  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns,
    data: query.data?.rows || [],
    getRowId: (row) => row.szIDs,
    manualPagination: true,
  });

  const printCheck = calcPrintCheck(
    ...table.getSelectedRowModel().flatRows.map((row) => row.original),
  );

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
          slotProps={{
            htmlInput: {
              list: userDataListId,
            },
          }}
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
        title="季度校验"
        subheader={printCheck.subheader}
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
              onChange={(e) => {
                setZX(e.target.value);
              }}
              fullWidth
              slotProps={{ htmlInput: { list: zxDataListId } }}
            />
            <datalist id={zxDataListId}>
              <option value="RE2B"></option>
              <option value="RD2"></option>
            </datalist>
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
      <CardContent>
        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={() => {
            const search = new URLSearchParams();

            table.getSelectedRowModel().flatRows.forEach((row) => {
              search.append("row", row.id);
            });

            navigate({
              pathname: "/quartors/chr502",
              search: "?" + search.toString(),
            });
          }}
          disabled={printCheck.disabledPrint}
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
          setPageIndex(0);
          setPageSize(Number(e.target.value));
        }}
        labelRowsPerPage="每页行数"
      />
    </Card>
  );
};
