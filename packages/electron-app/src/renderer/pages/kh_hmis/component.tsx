import type { KhBarcode } from "#main/db/schema";
import type { KHGetResponse } from "#main/shared/factories/hmis/kh_hmis";
import { useAutoInputToVC } from "#renderer/api/fetch_preload";
import {
  fetchKhRecord,
  useDeleteKhRecord,
  useFetchKhAxleInfo,
  useInsertKhRecord,
  useUploadAxleInfo,
} from "#renderer/api/kh";
import { useAutoFocusInputRef } from "#renderer/hooks/useAutoFocusInputRef";
import { useSubscribe } from "#renderer/hooks/useSubscribe";
import { cellPaddingMap, rowsPerPageOptions } from "#renderer/lib/constants";
import { useKhHmisStore } from "#renderer/shared/hooks/ui/useKhHmisStore";
import {
  CheckOutlined,
  ClearOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  FilterListOutlined,
  KeyboardReturn,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
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
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useDialogs, useNotifications } from "@toolpad/core";
import dayjs from "dayjs";
import React from "react";
import { z } from "zod";

const dateInitializer = () => dayjs();

const columnHelper = createColumnHelper<KhBarcode>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    footer: "ID",
    cell: ({ getValue }) => <Link underline="none">#{getValue()}</Link>,
  }),
  columnHelper.accessor("barCode", {
    header: "单号",
    footer: "单号",
  }),
  columnHelper.accessor("zh", {
    header: "轴号",
    footer: "轴号",
  }),
  columnHelper.accessor("date", {
    header: "时间",
    footer: "时间",
    cell: ({ getValue }) => getValue()?.toLocaleString(),
  }),
  columnHelper.accessor("isUploaded", {
    header: "已上传",
    footer: "已上传",
    cell: ({ getValue }) =>
      getValue() ? <CheckOutlined color="success" /> : <ClearOutlined />,
  }),
  columnHelper.display({
    id: "action",
    header: "操作",
    cell: ({ row }) => <ActionCell id={row.getValue("id")} />,
  }),
];

const schema = z.object({
  barCode: z.string().min(1),
});

type ActionCellProps = {
  id: number;
};

const ActionCell = (props: ActionCellProps) => {
  const saveData = useUploadAxleInfo();
  const snackbar = useNotifications();
  const dialog = useDialogs();
  const deleteBarcode = useDeleteKhRecord();

  const handleUpload = () => {
    saveData.mutate(props.id, {
      onError(error) {
        snackbar.show(error.message, {
          severity: "error",
        });
      },
      onSuccess() {
        snackbar.show("上传成功", {
          severity: "success",
        });
      },
    });
  };

  return (
    <>
      <IconButton disabled={saveData.isPending} onClick={handleUpload}>
        <CloudUploadOutlined />
      </IconButton>
      <IconButton
        onClick={async () => {
          const confirmed = await dialog.confirm("确定要删除这条记录吗？", {
            okText: "删除",
            cancelText: "取消",
            title: "警告",
          });
          if (confirmed) {
            deleteBarcode.mutate(props.id, {
              onError(error) {
                snackbar.show(error.message, {
                  severity: "error",
                });
              },
            });
          }
        }}
      >
        <DeleteOutlined color="error" />
      </IconButton>
    </>
  );
};

export const Component = () => {
  "use no memo";
  const [date, setDate] = React.useState(dateInitializer);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [showFilter, setShowFilter] = React.useState(false);

  const formRef = React.useRef<HTMLFormElement>(null);

  const formId = React.useId();

  const params = {
    pageIndex,
    pageSize,
    startDate: date.startOf("day").toISOString(),
    endDate: date.endOf("day").toISOString(),
  };

  const inputRef = useAutoFocusInputRef();
  const getData = useFetchKhAxleInfo();
  const snackbar = useNotifications();
  const autoInput = useAutoInputToVC();
  const barcode = useQuery(fetchKhRecord(params));
  const isAutoInput = useKhHmisStore((store) => store.autoInput);
  const insertRecord = useInsertKhRecord();

  const form = useForm({
    defaultValues: {
      barCode: "",
    },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      const data = await getData.mutateAsync(value.barCode, {
        onError: (error) => {
          snackbar.show(error.message, { severity: "error" });
        },
        onSuccess: () => {
          form.reset();
        },
      });

      if (isAutoInput) {
        void sendDataToWindow(data);
      }

      await insertRecord.mutateAsync({
        DH: data.data.mesureId,
        ZH: data.data.zh,
        CZZZDW: data.data.czzzdw,
        CZZZRQ: data.data.czzzrq,
      });
    },
  });

  const data = React.useMemo(() => barcode.data?.rows || [], [barcode.data]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id.toString(),
    getCoreRowModel: getCoreRowModel(),

    manualPagination: true,
    rowCount: barcode.data?.count || 0,
  });

  useSubscribe("api_set", () => {
    void barcode.refetch();
  });

  const sendDataToWindow = async (data: KHGetResponse) => {
    await autoInput.mutateAsync(
      {
        zx: data.data.zx,
        zh: data.data.zh,
        czzzdw: data.data.czzzdw,
        sczzdw: data.data.ldszdw,
        mczzdw: data.data.ldmzdw,
        czzzrq: data.data.czzzrq,
        sczzrq: data.data.ldszrq,
        mczzrq: data.data.ldmzrq,
        ztx: "1",
        ytx: "1",
      },
      {
        onError: (error) => {
          snackbar.show(error.message, { severity: "error" });
        },
      },
    );
  };

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
      <TableRow key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} padding={cellPaddingMap.get(cell.column.id)}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  const renderFilter = () => {
    if (!showFilter) return null;

    return (
      <>
        <Divider />
        <CardContent>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
              <DatePicker
                label="日期"
                value={date}
                onChange={(e) => {
                  if (!e) return;
                  setDate(e);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </>
    );
  };

  return (
    <Card>
      <CardHeader
        title="康华HMIS"
        subheader="安康"
        action={
          <IconButton onClick={() => setShowFilter((prev) => !prev)}>
            <FilterListOutlined color={showFilter ? "primary" : void 0} />
          </IconButton>
        }
      />
      <CardContent>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, sm: 10, md: 8, lg: 6, xl: 4 }}>
            <form
              ref={formRef}
              id={formId}
              noValidate
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit();
              }}
              onReset={() => form.reset()}
            >
              <form.Field name="barCode">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    name={field.name}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    inputRef={inputRef}
                    fullWidth
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <form.Subscribe
                              selector={(state) => [
                                state.canSubmit,
                                state.isSubmitting,
                              ]}
                            >
                              {([canSubmit, isSubmitting]) => {
                                return (
                                  <Button
                                    form={formId}
                                    type="submit"
                                    endIcon={
                                      isSubmitting ? (
                                        <CircularProgress
                                          size={16}
                                          color="inherit"
                                        />
                                      ) : (
                                        <KeyboardReturn />
                                      )
                                    }
                                    variant="contained"
                                    disabled={!canSubmit}
                                  >
                                    录入
                                  </Button>
                                );
                              }}
                            </form.Subscribe>
                          </InputAdornment>
                        ),
                        autoFocus: true,
                      },
                    }}
                    label="条形码/二维码"
                    placeholder="请扫描条形码或二维码"
                  />
                )}
              </form.Field>
            </form>
          </Grid>
        </Grid>
      </CardContent>
      {renderFilter()}
      {barcode.isFetching && <LinearProgress />}
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
