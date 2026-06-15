import type {
  PLCWritePayload,
  ReadDInput,
  ReadMInput,
  ReadXInput,
  ReadYInput,
  WriteDInput,
  WriteMInput,
  WriteYInput,
} from "#main/features/plc/types";
import { ipc } from "#renderer/lib/ipc";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const QUERY_KEY = "plc";

export const fetchPLCReadTest = (path: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "PLC/read_test", path],
    queryFn: () => {
      return ipc.invoke("PLC/read_test", path);
    },
  });
};

export const usePLCWriteTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PLCWritePayload) => {
      return ipc.invoke("PLC/write_test", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const fetchSerialPortList = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "PLC/serialport_list"],
    queryFn: () => {
      return ipc.invoke("PLC/serialport_list");
    },
  });
};

export const fetchXRead = (input: ReadXInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "x_read", input],
    queryFn: () => {
      return ipc.invoke("plc/x_read", input);
    },
  });
};

export const fetchYRead = (input: ReadYInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "y_read", input],
    queryFn: () => {
      return ipc.invoke("plc/y_read", input);
    },
  });
};

export const useYWrite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WriteYInput) => {
      return ipc.invoke("plc/y_write", input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const fetchMRead = (input: ReadMInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "m_read", input],
    queryFn: () => {
      return ipc.invoke("plc/m_read", input);
    },
  });
};

export const useMWrite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WriteMInput) => {
      return ipc.invoke("plc/m_write", input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const fetchDRead = (input: ReadDInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "d_read", input],
    queryFn: () => {
      return ipc.invoke("plc/d_read", input);
    },
  });
};

export const useDWrite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WriteDInput) => {
      return ipc.invoke("plc/d_write", input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};
