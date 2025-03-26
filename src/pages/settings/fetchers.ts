import { queryOptions } from "@tanstack/react-query";
import { ipcRenderer } from "@/lib/utils";
import * as channel from "@electron/channel";

export const fetchActivateInfo = () =>
  queryOptions({
    queryKey: [channel.getCpuSerial],
    queryFn: () => ipcRenderer.invoke(channel.getCpuSerial),
  });
