import type { VerifyData } from "#/cmd";
import { fetchDataFromAccessDatabase } from "@/api/fetch_preload";
import { Loading } from "@/components/Loading";
import {
  Alert,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
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
  Typography,
  CardActionArea,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { cellPaddingMap, rowsPerPageOptions } from "@/lib/constants";

const getDirection = (nBoard: number) => {
  //board(板卡)：0.左 1.右
  switch (nBoard) {
    case 1:
      return "右";
    case 0:
      return "左";
    default:
      return "";
  }
};

const getPlace = (nChannel: number) => {
  switch (nChannel) {
    case 0:
      return "穿透";
    case 1:
    case 2:
      return "卸荷槽";
    case 3:
      return "外";
    case 4:
      return "内";
    case 5:
    case 6:
    case 7:
    case 8:
      return "轮座";
    default:
      return "车轴";
  }
};

const columnHelper = createColumnHelper<VerifyData>();
const columns = [
  columnHelper.accessor("nBoard", {
    header: "方向",
    cell: ({ getValue }) => getDirection(getValue()),
  }),
  columnHelper.accessor("nChannel", {
    header: "位置",
    cell: ({ getValue }) => getPlace(getValue()),
  }),
  columnHelper.accessor("fltValueX", {
    header: "横距",
    footer: "横距",
  }),
  columnHelper.accessor("fltValueY", {
    header: "纵距",
    footer: "纵距",
  }),
  columnHelper.accessor("nAtten", {
    header: "灵敏度",
    footer: "灵敏度",
  }),
];

const check = (current: string, excepted: string) => {
  if (!excepted) return true;
  return Object.is(excepted, current);
};

export const Component = () => {
  "use no memo";
  const [direction, setDirection] = React.useState("");
  const [place, setPlace] = React.useState("");

  const params = useParams();
  const query = useQuery(
    fetchDataFromAccessDatabase<VerifyData>(
      `SELECT * FROM verifies_data WHERE opid ='${params.id}'`,
    ),
  );

  const data = React.useMemo(() => {
    const rows = query.data || [];
    return rows.filter(
      (row) =>
        check(getDirection(row.nBoard), direction) &&
        check(getPlace(row.nChannel), place),
    );
  }, [query.data, direction, place]);

  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns,
    data,
    getRowId: (row) => JSON.stringify(row),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const map = (query.data || []).reduce((result, row) => {
    const direction = getDirection(row.nBoard);
    const place = getPlace(row.nChannel);
    const key = direction + place;
    const prev = result.get(key) || new Set();
    result.set(key, prev.add(row));

    return result;
  }, new Map<string, Set<VerifyData>>());

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
    <Grid container spacing={1.5}>
      <Grid size={6}>
        <Card>
          <CardActionArea
            onClick={() => {
              setDirection("左");
              setPlace("穿透");
            }}
          >
            <CardContent>
              <Typography variant="h4">{map.get("左穿透")?.size}</Typography>
              <Typography>左穿透</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
      <Grid size={6}>
        <Card>
          <CardActionArea
            onClick={() => {
              setDirection("右");
              setPlace("穿透");
            }}
          >
            <CardContent>
              <Typography variant="h4">{map.get("右穿透")?.size}</Typography>
              <Typography>右穿透</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
      <Grid size={6}>
        <Card>
          <CardActionArea
            onClick={() => {
              setDirection("左");
              setPlace("卸荷槽");
            }}
          >
            <CardContent>
              <Typography variant="h4">{map.get("左卸荷槽")?.size}</Typography>
              <Typography>左卸荷槽</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
      <Grid size={6}>
        <Card>
          <CardActionArea
            onClick={() => {
              setDirection("右");
              setPlace("卸荷槽");
            }}
          >
            <CardContent>
              <Typography variant="h4">{map.get("右卸荷槽")?.size}</Typography>
              <Typography>右卸荷槽</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
      <Grid size={6}>
        <Card>
          <CardActionArea
            onClick={() => {
              setDirection("左");
              setPlace("内");
            }}
          >
            <CardContent>
              <Typography variant="h4">{map.get("左内")?.size}</Typography>
              <Typography>左内</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
      <Grid size={6}>
        <Card>
          <CardActionArea
            onClick={() => {
              setDirection("右");
              setPlace("内");
            }}
          >
            <CardContent>
              <Typography variant="h4">{map.get("右内")?.size}</Typography>
              <Typography>右内</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
      <Grid size={6}>
        <Card>
          <CardActionArea
            onClick={() => {
              setDirection("左");
              setPlace("外");
            }}
          >
            <CardContent>
              <Typography variant="h4">{map.get("左外")?.size}</Typography>
              <Typography>左外</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
      <Grid size={6}>
        <Card>
          <CardActionArea
            onClick={() => {
              setDirection("右");
              setPlace("外");
            }}
          >
            <CardContent>
              <Typography variant="h4">{map.get("右外")?.size}</Typography>
              <Typography>右外</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
      <Grid size={12}>
        <Card>
          <CardHeader title="详情" />
          <CardContent>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  select
                  fullWidth
                  label="方向"
                >
                  <MenuItem value="">无</MenuItem>
                  <MenuItem value="左">左</MenuItem>
                  <MenuItem value="右">右</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  select
                  fullWidth
                  label="位置"
                >
                  <MenuItem value="">无</MenuItem>
                  <MenuItem value="穿透">穿透</MenuItem>
                  <MenuItem value="卸荷槽">卸荷槽</MenuItem>
                  <MenuItem value="内">内</MenuItem>
                  <MenuItem value="外">外</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
          <Divider />
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
            page={table.getState().pagination.pageIndex}
            count={table.getRowCount()}
            rowsPerPage={table.getState().pagination.pageSize}
            rowsPerPageOptions={rowsPerPageOptions}
            onPageChange={(e, page) => {
              void e;
              table.setPageIndex(page);
            }}
            onRowsPerPageChange={(e) => {
              table.setPageSize(Number.parseInt(e.target.value, 10));
            }}
            labelRowsPerPage="每页行数"
          />
        </Card>
      </Grid>
    </Grid>
  );
};
