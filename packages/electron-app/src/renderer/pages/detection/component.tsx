import type { Detection } from "#main/features/mdb/types";
import { fetchDetections, fetchUser } from "#renderer/api/mdb";
import { Loading } from "#renderer/components/Loading";
import { ScrollToTopButton } from "#renderer/components/scroll";
import { cellPaddingMap, rowsPerPageOptions } from "#renderer/lib/constants";
import {
  CheckBoxOutlineBlankOutlined,
  CheckBoxOutlined,
  Print,
  RefreshOutlined,
} from "@mui/icons-material";
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
  MenuItem,
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

const renderCheckBoxIcon = (value: boolean | null) => {
  return value ? <CheckBoxOutlined /> : <CheckBoxOutlineBlankOutlined />;
};

const szIDToId = (szID: string) => szID.split(".").at(0)?.slice(-7);
const columnHelper = createColumnHelper<Detection>();
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
        <Link component={RouterLink} to={`/detection/${szID}`}>
          #{szIDToId(szID)}
        </Link>
      );
    },
    header: "ID",
    footer: "ID",
  }),
  columnHelper.accessor("szIDsWheel", { header: "轴号", footer: "轴号" }),
  columnHelper.accessor("szWHModel", { header: "轴型", footer: "轴型" }),
  columnHelper.accessor("szIDsMake", {
    header: "制造单位",
    footer: "制造单位",
  }),
  columnHelper.accessor("szTMMake", {
    header: "制造时间",
    footer: "制造时间",
  }),
  columnHelper.accessor("szIDsFirst", {
    header: "首装单位",
    footer: "首装单位",
  }),
  columnHelper.accessor("szTMFirst", {
    header: "首装时间",
    footer: "首装时间",
  }),
  columnHelper.accessor("szUsername", { header: "检测员", footer: "检测员" }),
  columnHelper.accessor("bWheelLS", {
    cell: ({ getValue }) => renderCheckBoxIcon(getValue()),
    header: "左轴承",
    footer: "左轴承",
  }),
  columnHelper.accessor("bWheelRS", {
    cell: ({ getValue }) => renderCheckBoxIcon(getValue()),
    header: "右轴承",
    footer: "右轴承",
  }),
  columnHelper.accessor("tmnow", {
    header: "时间",
    footer: "时间",
    cell: ({ getValue }) => {
      const tmnow = getValue();
      if (!tmnow) return null;

      return new Date(tmnow).toLocaleString();
    },
  }),
  columnHelper.accessor("szResult", { header: "检测结果", footer: "检测结果" }),
];

interface ValidateSelectedResult {
  disabledCH53A: boolean;
  subheader?: React.ReactNode;
}

const validateSelected = (rows: Detection[]): ValidateSelectedResult => {
  let date = "";
  let user = "";

  for (const row of rows) {
    date ||= dayjs(row.tmnow).format("YYYY-MM-DD");

    const isSameDate = Object.is(date, dayjs(row.tmnow).format("YYYY-MM-DD"));

    if (!isSameDate) {
      return {
        disabledCH53A: true,
        subheader: "存在日期不一致的记录",
      };
    }

    if (!row.szUsername) {
      return {
        disabledCH53A: true,
        subheader: "不能选择无操作者的记录",
      };
    }

    user ||= row.szUsername;

    const isSameUser = Object.is(user, row.szUsername);

    if (!isSameUser) {
      return {
        disabledCH53A: true,
        subheader: "存在操作者不一致的记录",
      };
    }
  }

  return {
    disabledCH53A: false,
    subheader: `已选中${rows.length}条`,
  };
};

export const Component = () => {
  "use no memo";

  const [date, setDate] = React.useState<dayjs.Dayjs | null>(() => dayjs());
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(100);
  const [zx, setZx] = React.useState("");
  const [zh, setZh] = React.useState("");
  const [result, setResult] = React.useState("");
  const [user, setUser] = React.useState("");

  const query = useQuery(
    fetchDetections({
      zx,
      zh,
      user,
      result,
      date: date ? date.toISOString() : "",
      pageIndex,
      pageSize,
    }),
  );

  const navigate = useNavigate();
  const usersQuery = useQuery(fetchUser({ pageIndex: 0, pageSize: 1000 }));

  const data = React.useMemo(() => query.data?.rows || [], [query.data]);

  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns,
    data,
    getRowId: (row) => row.szIDs,
    manualPagination: true,
  });

  const { subheader, disabledCH53A } = validateSelected(
    table.getSelectedRowModel().flatRows.map((row) => row.original),
  );

  const renderRow = () => {
    if (query.isPending) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            <Loading
              slotProps={{
                box: { padding: 0 },
              }}
            />
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
          title="现车作业"
          subheader={subheader}
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="检测员"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                fullWidth
                select
              >
                <MenuItem value={""}>未指定</MenuItem>
                {usersQuery.data?.rows.map((user) => (
                  <MenuItem key={user.szUid} value={user.szUid}>
                    {user.szUid}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="轴型"
                value={zx}
                onChange={(e) => setZx(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="轴号"
                value={zh}
                onChange={(e) => setZh(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="检测结果"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardContent>
          <Button
            startIcon={<Print />}
            disabled={disabledCH53A}
            variant="outlined"
            onClick={() => {
              navigate("/detection/chr53a", {
                state: table
                  .getSelectedRowModel()
                  .flatRows.map((row) => row.original.szIDs),
              });
            }}
          >
            CHR53A
          </Button>
        </CardContent>
        {query.isFetching && <LinearProgress />}
        <TableContainer>
          <Table sx={{ minWidth: (theme) => theme.breakpoints.values.lg }}>
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
        <Divider />
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
