import { fetchQTDetections } from "#renderer/api/qt";
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
import dayjs from "dayjs";
import React from "react";
import { Link as RouterLink, useNavigate } from "react-router";

type Row = typeof schema.detectors.$inferSelect;

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
    cell: ({ getValue }) => {
      const value = getValue();

      return (
        <Link
          component={RouterLink}
          to={{ pathname: `/qt/detections/${value}/52a` }}
        >
          #{value?.slice(-6)}
        </Link>
      );
    },
  }),
  columnHelper.accessor("szZh", {
    header: "轴号",
  }),
  columnHelper.accessor("szWhModel", {
    header: "轴型",
  }),
  columnHelper.accessor("szIdsMake", {
    header: "制造单位",
  }),
  columnHelper.accessor("szTmMake", {
    header: "制造时间",
  }),
  columnHelper.accessor("szIdsFirst", {
    header: "首装单位",
  }),
  columnHelper.accessor("szTmFirst", {
    header: "首装时间",
  }),
  columnHelper.accessor("szUsername", {
    header: "检测员",
  }),
  columnHelper.accessor("bWheelLs", {
    header: "左轴承",
  }),
  columnHelper.accessor("bWheelRs", {
    header: "右轴承",
  }),
  columnHelper.accessor("tmNow", {
    header: "时间",
  }),
  columnHelper.accessor("szResult", {
    header: "结果",
  }),
];

interface ValidateSelectedResult {
  disabledCH53A: boolean;
  subheader?: React.ReactNode;
}

const validateSelected = (rows: Row[]): ValidateSelectedResult => {
  if (rows.length === 0) {
    return {
      disabledCH53A: true,
      subheader: "未选中作业记录",
    };
  }

  let date = "";
  let user = "";

  for (const row of rows) {
    date ||= dayjs(row.tmNow).format("YYYY-MM-DD");

    const isSameDate = Object.is(date, dayjs(row.tmNow).format("YYYY-MM-DD"));

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
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(100);
  const [user, setUser] = React.useState("");
  const [day, setDay] = useDayjs();
  const [zx, setZx] = React.useState("");
  const [zh, setZh] = React.useState("");
  const [result, setResult] = React.useState("");

  const navigate = useNavigate();
  const date = day?.toISOString() || "";
  const query = useQuery(
    fetchQTDetections({ pageIndex, pageSize, date, user, zx, zh, result }),
  );
  const data = React.useMemo(() => query.data?.rows || [], [query.data]);
  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns,
    data,
    getRowId: (r) => r.recId.toString(10),
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
          title="现车作业"
          subheader={subheader}
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
              <TextField
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                }}
                label="检测员"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                value={zx}
                onChange={(e) => {
                  setZx(e.target.value);
                }}
                label="轴型"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                value={zh}
                onChange={(e) => {
                  setZh(e.target.value);
                }}
                label="轴号"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                value={result}
                onChange={(e) => {
                  setResult(e.target.value);
                }}
                label="结果"
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
              navigate("/qt/detections/53a", {
                state: {
                  ids: table
                    .getSelectedRowModel()
                    .flatRows.map((row) => row.original.recId),
                },
              });
            }}
          >
            打印
          </Button>
        </CardContent>
        {query.isFetching && <LinearProgress />}
        <TableContainer>
          <Table sx={{ minWidth: (t) => t.breakpoints.values.lg }}>
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