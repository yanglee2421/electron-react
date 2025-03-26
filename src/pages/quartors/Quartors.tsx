import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  TableCellProps,
  Typography,
  Grid2,
  Link,
  IconButton,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import {
  useIndexedStore,
  useIndexedStoreHasHydrated,
} from "@/hooks/useIndexedStore";
import { RefreshOutlined } from "@mui/icons-material";

const paddMap = new Map<string, TableCellProps["padding"]>();
paddMap.set("checkbox", "checkbox");

const checkDate = (day: null | dayjs.Dayjs, date: string | null) => {
  if (!day) return true;
  if (!date) return true;

  return day.toDate().toDateString() === dayjs(date).toDate().toDateString();
};

export const Quartors = () => {
  const hasHydrated = useIndexedStoreHasHydrated();
  const settings = useIndexedStore((s) => s.settings);
  return null;
};
