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
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableContainer,
  Divider,
  Button,
  Link,
  LinearProgress,
  TextField,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import { Link as RouterLink } from "react-router";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { cellPaddingMap, rowsPerPageOptions } from "@/lib/constants";
import { PrintOutlined, RefreshOutlined } from "@mui/icons-material";
import {
  fetchDataFromAppDB,
  fetchDataFromRootDB,
  type MDBUser,
  useChr501Export,
} from "@/api/fetch_preload";
import type { Verify } from "#/modules/cmd";
import { Loading } from "@/components/Loading";
import { useSessionStore } from "./hooks";
import type { Filter } from "#/modules/mdb.worker";
import { useNotifications } from "@toolpad/core";
import { ScrollToTop } from "@/components/scroll";

const szIDToId = (szID: string) => szID.split(".").at(0)?.slice(-7);
const columnHelper = createColumnHelper<Verify>();

const columns = [
  columnHelper.accessor("szIDs", {
    header: "ID",
    footer: "ID",
    cell: ({ getValue }) => {
      const szID = getValue();

      return (
        <Link component={RouterLink} to={`/verify/${szID}`}>
          #{szIDToId(szID)}
        </Link>
      );
    },
  }),
  columnHelper.accessor("szIDsWheel", { header: "轴号", footer: "轴号" }),
  columnHelper.accessor("szWHModel", { header: "轴型", footer: "轴型" }),
  // columnHelper.accessor("szIDsFirst", {
  //   header: "首装单位",
  //   footer: "首装单位",
  // }),
  // columnHelper.accessor("szTMFirst", {
  //   header: "首装时间",
  //   footer: "首装时间",
  // }),
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
];

type DataGridProps = {
  data?: Verify[];
  isPending?: boolean;
  isError?: boolean;
  error?: Error | null;
  isFetching?: boolean;
};

const DataGrid = (props: DataGridProps) => {
  "use no memo";
  const [selected, setSelected] = React.useState("");

  const toast = useNotifications();
  const exportXlsx = useChr501Export();
  const data = React.useMemo(() => props.data || [], [props.data]);

  const table = useReactTable({
    columns,
    data,
    getRowId: (row) => row.szIDs,

    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const renderRow = () => {
    if (props.isPending) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            <Loading
              slotProps={{
                box: {
                  padding: 0,
                },
              }}
            />
          </TableCell>
        </TableRow>
      );
    }

    if (props.isError) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <Alert severity="error" variant="filled">
              <AlertTitle>错误</AlertTitle>
              {props.error?.message}
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
      <TableRow
        key={row.id}
        selected={Object.is(selected, row.id)}
        hover
        sx={{ cursor: "pointer" }}
        onClick={() => setSelected(row.id)}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} padding={cellPaddingMap.get(cell.column.id)}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  const getSelectedId = () => {
    if (!selected) return;
    return table
      .getRowModel()
      .flatRows.find((row) => Object.is(row.id, selected))?.id;
  };

  const selectedId = getSelectedId();

  return (
    <>
      <CardContent>
        <Button
          startIcon={
            exportXlsx.isPending ? (
              <CircularProgress color="inherit" size={20} />
            ) : (
              <PrintOutlined />
            )
          }
          onClick={() => {
            if (!selectedId) {
              toast.show("请选中一行数据再继续！", { severity: "error" });
              return;
            }
            exportXlsx.mutate(selectedId, {
              onError(error) {
                toast.show(error.message, { severity: "error" });
              },
            });
          }}
          variant="outlined"
          disabled={!selectedId}
        >
          Excel
        </Button>
      </CardContent>
      {props.isFetching && <LinearProgress />}
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
    </>
  );
};

export const Component = () => {
  const selectDate = useSessionStore((s) => s.date);
  const pageIndex = useSessionStore((s) => s.pageIndex);
  const pageSize = useSessionStore((s) => s.pageSize);
  const username = useSessionStore((s) => s.username);
  const whModel = useSessionStore((s) => s.whModel);
  const idsWheel = useSessionStore((s) => s.idsWheel);
  const result = useSessionStore((s) => s.result);
  const [anchorEl, showScrollToTop] = ScrollToTop.useScrollToTop();

  const date = selectDate ? dayjs(selectDate) : null;
  const filters: Filter[] = [
    date
      ? {
          type: "date" as const,
          field: "tmnow",
          startAt: date.startOf("day").toISOString(),
          endAt: date.endOf("day").toISOString(),
        }
      : false,
    {
      type: "like" as const,
      field: "szUsername",
      value: username,
    },
    {
      type: "like" as const,
      field: "szWHModel",
      value: whModel,
    },
    {
      type: "like" as const,
      field: "szIDsWheel",
      value: idsWheel,
    },
    {
      type: "like" as const,
      field: "szResult",
      value: result,
    },
  ].filter((i) => typeof i === "object");

  const query = useQuery(
    fetchDataFromRootDB<Verify>({
      tableName: "verifies",
      pageIndex,
      pageSize,
      filters,
    }),
  );

  const usersQuery = useQuery(
    fetchDataFromAppDB<MDBUser>({
      tableName: "users",
      pageIndex: 0,
      pageSize: 100,
    }),
  );

  const set = useSessionStore.setState;
  const setDate = (day: dayjs.Dayjs | null) =>
    set((d) => {
      d.date = day ? day.toISOString() : null;
    });

  const setPageIndex = (page: number) =>
    set((d) => {
      d.pageIndex = page;
    });

  const setPageSize = (pageSize: number) =>
    set((d) => {
      d.pageSize = pageSize;
    });

  const setWHModel = (whModel: string) =>
    set((d) => {
      d.whModel = whModel;
    });

  const setIdsWheel = (idsWheel: string) =>
    set((d) => {
      d.idsWheel = idsWheel;
    });

  const setResult = (result: string) =>
    set((d) => {
      d.result = result;
    });

  const renderUserSelect = () => {
    if (!usersQuery.isSuccess) return null;

    return (
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          value={username}
          onChange={(e) => {
            set((d) => {
              d.username = e.target.value;
            });
          }}
          label="检测员"
          select
        >
          {usersQuery.data.rows.map((user) => (
            <MenuItem key={user.szUid} value={user.szUid}>
              {user.szUid}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    );
  };

  return (
    <Card>
      <div ref={anchorEl}></div>
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
              value={whModel}
              onChange={(e) => setWHModel(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="轴号"
              value={idsWheel}
              onChange={(e) => setIdsWheel(e.target.value)}
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
      <DataGrid
        data={query.data?.rows}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        isFetching={query.isFetching}
      />
      <TablePagination
        component={"div"}
        count={query.data?.total || 0}
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
      <ScrollToTop ref={anchorEl} show={showScrollToTop} />
    </Card>
  );
};
