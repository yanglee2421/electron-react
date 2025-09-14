import { QueryProvider } from "@/components/query";
import {
  fetchDataFromAppDB,
  fetchDataFromRootDB,
  type MDBUser,
} from "@/api/fetch_preload";
import { useSessionStore } from "./hooks";
import type { Filter } from "#/mdb.worker";
import dayjs from "dayjs";

export const loader = async () => {
  const queryClient = QueryProvider.queryClient;
  const state = useSessionStore.getState();

  await queryClient.ensureQueryData(
    fetchDataFromAppDB<MDBUser>({
      tableName: "users",
      pageIndex: 0,
      pageSize: 100,
    }),
  );

  const {
    pageIndex,
    pageSize,
    date: selectDate,
    username,
    whModel,
    idsWheel,
    result,
  } = state;

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

  await queryClient
    .ensureQueryData(
      fetchDataFromRootDB({
        tableName: "verifies",
        pageIndex,
        pageSize,
        filters,
      }),
    )
    .catch(Boolean);
};
