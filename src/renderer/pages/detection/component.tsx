import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  type DialogProps,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { cellPaddingMap, rowsPerPageOptions } from "@/lib/constants";
import {
  CheckBoxOutlineBlankOutlined,
  CheckBoxOutlined,
  PrintOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import type { Detection } from "#/cmd";
import { Loading } from "@/components/Loading";
import { Link as RouterLink } from "react-router";
import { useSessionStore } from "./hooks";
import type { Filter } from "#/mdb.worker";
import {
  useChr53aExport,
  fetchDataFromRootDB,
  fetchDataFromAppDB,
  type MDBUser,
} from "@/api/fetch_preload";
import { ScrollToTop } from "@/components/scroll";
import { useDialogs } from "@toolpad/core";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const renderCheckBoxIcon = (value: boolean | null) => {
  return value ? <CheckBoxOutlined /> : <CheckBoxOutlineBlankOutlined />;
};

const szIDToId = (szID: string) => szID.split(".").at(0)?.slice(-7);
const columnHelper = createColumnHelper<Detection>();

const columns = [
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

type DataGridProps = {
  data: Detection[];
  total?: number;
  isPending?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  error?: Error | null;
};

const DataGrid = ({
  data,
  total,
  isPending,
  isError,
  isFetching,
  error,
}: DataGridProps) => {
  "use no memo";

  const chr53a = useChr53aExport();
  const dialogs = useDialogs();

  const table = useReactTable({
    columns,
    data,
    getRowId: (row) => row.szIDs,
    rowCount: total,

    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const renderRow = () => {
    if (isPending) {
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

    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <Alert severity="error" variant="filled">
              <AlertTitle>错误</AlertTitle>
              {error?.message}
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
      <CardContent>
        <Button
          onClick={() => {
            dialogs.open(ExportToXlsx);
          }}
          disabled={chr53a.isPending}
          startIcon={
            chr53a.isPending ? (
              <CircularProgress size={20} />
            ) : (
              <PrintOutlined />
            )
          }
          variant="outlined"
        >
          Excel
        </Button>
      </CardContent>
      {isFetching && <LinearProgress />}
      <TableContainer>
        <Table sx={{ minWidth: 1024 }}>
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
  const [anchorEl, showScrollToTop] = ScrollToTop.useScrollToTop();
  const selectDate = useSessionStore((s) => s.date);
  const pageIndex = useSessionStore((s) => s.pageIndex);
  const pageSize = useSessionStore((s) => s.pageSize);
  const username = useSessionStore((s) => s.username);
  const whModel = useSessionStore((s) => s.whModel);
  const idsWheel = useSessionStore((s) => s.idsWheel);
  const result = useSessionStore((s) => s.result);

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
    fetchDataFromRootDB<Detection>({
      tableName: "detections",
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

  const data = React.useMemo(() => query.data?.rows || [], [query.data]);

  const set = useSessionStore.setState;
  const setDate = (day: null | dayjs.Dayjs) =>
    set((d) => {
      d.date = day ? day.toISOString() : null;
    });

  const setPageIndex = (page: number) =>
    set((d) => {
      d.pageIndex = page;
    });

  const setPageSize = (size: number) =>
    set((d) => {
      d.pageSize = size;
    });

  const setUsername = (username: string) =>
    set((d) => {
      d.username = username;
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

  return (
    <Card>
      <div ref={anchorEl}></div>
      <CardHeader
        title="现车作业"
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
              value={null}
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              select
            >
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
        data={data}
        total={query.data?.total}
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        error={query.error}
      />
      <Divider />
      <TablePagination
        component={"div"}
        page={pageIndex}
        count={query.data?.total || 0}
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

const exportToXlsxSchema = z.object({
  username: z.string().min(1),
  date: z.iso.datetime(),
});

const ExportToXlsx = (props: DialogProps) => {
  const formId = React.useId();

  const date = useSessionStore((s) => s.date);
  const username = useSessionStore((s) => s.username);
  const form = useForm({
    defaultValues: {
      username,
      date,
    },
    validators: {
      onChange: exportToXlsxSchema,
    },
    onSubmit() {},
  });

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth>
      <DialogTitle>探伤作业表</DialogTitle>
      <DialogContent>
        <form
          id={formId}
          onSubmit={(e) => {
            console.log("submit");

            e.stopPropagation();
            e.preventDefault();
            form.handleSubmit();
          }}
          onReset={(e) => {
            form.reset();
            props.onClose?.(e, "backdropClick");
          }}
        >
          <Grid container spacing={3}>
            <Grid size={12}>
              <form.Field name="date">
                {(dateField) => (
                  <DatePicker
                    value={dayjs(dateField.state.value)}
                    onChange={(value) => {
                      const nextValue = value?.toISOString();
                      if (nextValue) {
                        dateField.handleChange(nextValue);
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!dateField.state.meta.errors.length,
                        helperText: dateField.state.meta.errors.at(0)?.message,
                      },
                    }}
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={12}>
              <form.Field name="username">
                {(userNameField) => (
                  <TextField
                    value={userNameField.state.value}
                    onChange={(e) => {
                      userNameField.handleChange(e.target.value);
                    }}
                    onBlur={userNameField.handleBlur}
                    fullWidth
                    error={!!userNameField.state.meta.errors.length}
                    helperText={userNameField.state.meta.errors.at(0)?.message}
                  />
                )}
              </form.Field>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button form={formId} type="reset">
          Cancel
        </Button>
        <Button form={formId} type="submit">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};
