import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Checkbox,
  Grid2,
  Typography,
  TableCellProps,
  Link,
  IconButton,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import {
  useIndexedStore,
  useIndexedStoreHasHydrated,
} from "@/hooks/useIndexedStore";
import { RefreshOutlined } from "@mui/icons-material";

const columns = [];

export const Verifies = () => {
  const hasHydrated = useIndexedStoreHasHydrated();
  const settings = useIndexedStore((s) => s.settings);

  return (
    <Card>
      <CardHeader title="Verifies" />
      <CardContent>
        <Grid2 container spacing={6}>
          <Grid2 size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}></Grid2>
        </Grid2>
      </CardContent>
      <TableContainer>
        <Table>
          <TableHead></TableHead>
          <TableBody></TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
