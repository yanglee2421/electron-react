import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
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
import * as consts from "@/lib/constants";
import type { XlsxSize } from "#/schema";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/Loading";
import { Link } from "react-router";
import { AddOutlined, RefreshOutlined } from "@mui/icons-material";
import React from "react";

const cellPaddingMap = consts.cellPaddingMap;
const columnHelper = createColumnHelper<XlsxSize>();
const columns = [
  columnHelper.accessor("id", {}),
  columnHelper.accessor("index", {}),
  columnHelper.accessor("size", {}),
  columnHelper.accessor("type", {}),
  columnHelper.accessor("xlsxName", {}),
];

export const Component = () => {
  const [xlsxName, setXlsxName] = React.useState("");
  const [type, setType] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const table = useReactTable({
    columns,
    data: [],
    getCoreRowModel: getCoreRowModel(),
  });

  const query = useQuery({
    queryKey: ["test"],
    queryFn: () => [],
  });

  const renderRow = () => {
    if (query.isPending) {
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

    if (query.isError) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <Alert severity="error" variant="filled">
              <AlertTitle>错误</AlertTitle>
              {query.error.message}
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
      <CardHeader
        title="xlsx尺寸"
        subheader="xlsx尺寸设置"
        action={
          <IconButton>
            <RefreshOutlined />
          </IconButton>
        }
      />
      <CardContent>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              value={xlsxName}
              onChange={(e) => {
                setXlsxName(e.target.value);
              }}
              select
              fullWidth
              label="xlsx名称"
            >
              <MenuItem value="">无</MenuItem>
              <MenuItem value="row">行</MenuItem>
              <MenuItem value="column">列</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              value={type}
              onChange={(e) => {
                setType(e.target.value);
              }}
              select
              fullWidth
              label="行/列"
            >
              <MenuItem value="">无</MenuItem>
              <MenuItem value="row">行</MenuItem>
              <MenuItem value="column">列</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
      <CardContent>
        <Button
          component={Link}
          to={"/xlsx/new"}
          variant="contained"
          startIcon={<AddOutlined />}
        >
          Add
        </Button>
        <Button
          component={Link}
          to={"/xlsx/1/edit"}
          variant="contained"
          startIcon={<AddOutlined />}
        >
          Add
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
                    padding={consts.cellPaddingMap.get(header.column.id)}
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
                    padding={consts.cellPaddingMap.get(header.column.id)}
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
        count={100}
        page={pageIndex}
        rowsPerPage={pageSize}
        onPageChange={(e, page) => {
          void e;
          setPageIndex(page);
        }}
        onRowsPerPageChange={(e) => {
          setPageSize(Number.parseInt(e.target.value));
        }}
        rowsPerPageOptions={consts.rowsPerPageOptions}
      />
    </Card>
  );
};
