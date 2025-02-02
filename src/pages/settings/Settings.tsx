import {
  useIndexedStore,
  useIndexedStoreHasHydrated,
} from "@/hooks/useIndexedStore";
import {
  BugReportOutlined,
  FileDownloadOutlined,
  FileUploadOutlined,
  FindInPageOutlined,
  SaveOutlined,
} from "@mui/icons-material";
import {
  Card,
  CardContent,
  CardHeader,
  Grid2,
  TextField,
  InputAdornment,
  IconButton,
  CardActions,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
  Box,
  useTheme,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import * as channel from "@electron/channel";
import { ipcRenderer, webUtils } from "@/lib/utils";
import { useStore } from "@/hooks/useStore";
import { useSize } from "@/hooks/useSize";
import { queryOptions, useQuery } from "@tanstack/react-query";

const schema = z.object({
  path: z.string().min(1),
  dsn: z.string().min(1),
  refetchInterval: z.number().int().positive(),
});

const SettingsForm = () => {
  const [currentTab, setCurrentTab] = React.useState("database");

  const formId = React.useId();

  const [isPending, startTransition] = React.useTransition();

  const settings = useIndexedStore((s) => s.settings);
  const set = useIndexedStore((s) => s.set);
  const form = useForm({
    defaultValues: {
      path: settings.databasePath,
      dsn: settings.databaseDsn,
      refetchInterval: settings.refetchInterval,
    },

    resolver: zodResolver(schema),
  });
  const setMsg = useStore((s) => s.set);

  const renderTabContent = () => {
    switch (currentTab) {
      case "database":
        return (
          <>
            <CardContent>
              <form
                id={formId}
                action={() =>
                  form.handleSubmit((data) => {
                    set((d) => {
                      d.settings.databasePath = data.path;
                      d.settings.databaseDsn = data.dsn;
                      d.settings.refetchInterval = data.refetchInterval;
                    });
                    setMsg((d) => {
                      d.msg = "Save successfully!";
                    });
                  }, console.error)()
                }
                onReset={() => form.reset()}
              >
                <Grid2 container spacing={6}>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Controller
                      control={form.control}
                      name="path"
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          fullWidth
                          label="Database"
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton component="label">
                                    <input
                                      type="file"
                                      accept="application/msaccess,application/vnd.ms-access,.mdb,.accdb"
                                      hidden
                                      value={""}
                                      onChange={(e) => {
                                        const file = e.target.files?.item(0);
                                        if (!file) return;

                                        field.onChange(
                                          webUtils.getPathForFile(file)
                                        );
                                      }}
                                    />
                                    <FindInPageOutlined />
                                  </IconButton>
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      )}
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Controller
                      control={form.control}
                      name="dsn"
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          fullWidth
                          label="ODBC DSN"
                        />
                      )}
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Controller
                      control={form.control}
                      name="refetchInterval"
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          onChange={(e) => {
                            const eVal = e.target.value;

                            if (eVal === "") {
                              field.onChange(eVal);
                              return;
                            }

                            const val = Number(eVal);

                            if (Number.isNaN(val)) {
                              field.onChange(eVal);
                            } else {
                              field.onChange(val);
                            }
                          }}
                          onBlur={(e) => {
                            field.onBlur();
                            field.onChange(
                              Number.parseInt(e.target.value, 10) || ""
                            );
                          }}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          fullWidth
                          label="Refetch Interval"
                          slotProps={{ htmlInput: { inputMode: "numeric" } }}
                          placeholder="2000"
                        />
                      )}
                    />
                  </Grid2>
                </Grid2>
              </form>
            </CardContent>
            <CardActions>
              <Button type="submit" form={formId} startIcon={<SaveOutlined />}>
                Save
              </Button>
              <Button component="label" startIcon={<FileDownloadOutlined />}>
                <input
                  type="file"
                  accept="application/json,.json"
                  hidden
                  value={""}
                  onChange={(e) => {
                    const file = e.target.files?.item(0);
                    if (!file) return;
                    const reader = new FileReader();

                    reader.onload = (e) => {
                      console.log(e.target?.result);
                    };

                    reader.readAsText(file);
                  }}
                />
                Import
              </Button>
              <Button
                onClick={() => {
                  // 创建 JSON 数据
                  const data = useIndexedStore.getState();
                  const version =
                    useIndexedStore.persist.getOptions().version || 0;

                  // 将 JSON 数据转换为字符串
                  const jsonString = JSON.stringify(data, null, 2);

                  // 创建 Blob 对象
                  const blob = new Blob([jsonString], {
                    type: "application/json",
                  });

                  // 创建下载链接
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `backup-v${version}.json`; // 下载的文件名

                  // 触发下载
                  document.body.appendChild(link); // 将链接添加到 DOM
                  link.click(); // 自动点击链接
                  document.body.removeChild(link); // 下载后移除链接
                }}
                startIcon={<FileUploadOutlined />}
              >
                export
              </Button>
            </CardActions>
          </>
        );
      case "hmis":
        return (
          <>
            <CardContent></CardContent>
            <CardActions>
              <Button startIcon={<SaveOutlined />}>Save</Button>
            </CardActions>
          </>
        );
    }
  };

  return (
    <Card>
      <CardHeader
        title="Settings"
        action={
          <IconButton
            disabled={isPending}
            onClick={() => {
              startTransition(() => ipcRenderer.invoke(channel.openDevTools));
            }}
          >
            <BugReportOutlined />
          </IconButton>
        }
      />
      <Tabs
        value={currentTab}
        onChange={(e, val) => {
          void e;
          setCurrentTab(val);
        }}
        variant="scrollable"
      >
        <Tab label="Database" value="database" />
        <Tab label="HMIS" value="hmis" />
      </Tabs>
      {renderTabContent()}
    </Card>
  );
};
// Joney
type Mem = { totalmem: number; freemem: number };
const fetchMem = () =>
  queryOptions<Mem>({
    queryKey: [channel.mem],
    queryFn() {
      return ipcRenderer.invoke(channel.mem);
    },
  });

const MemCard = () => {
  const [data, setData] = React.useState<Mem[]>([]);

  const divRef = React.useRef(null);

  const theme = useTheme();
  const [size] = useSize(divRef);
  const mem = useQuery({
    ...fetchMem(),
    refetchInterval: 16,
    refetchIntervalInBackground: false,
  });

  const width = size?.contentBoxSize.at(0)?.inlineSize || 0;
  const height = 300;

  React.useEffect(() => {
    if (!mem.data) return;

    React.startTransition(() => setData((p) => [...p, mem.data].slice(-width)));
  }, [mem.data, width]);

  return (
    <Card>
      <CardHeader title="Memory" />
      <CardContent>
        <Box ref={divRef} sx={{ position: "relative", height }}>
          <svg
            height={height}
            width={width}
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            <line
              stroke={theme.palette.divider}
              x1={0}
              y1={0}
              x2={0}
              y2={height}
            />
            <line
              stroke={theme.palette.divider}
              x1={0}
              y1={height}
              x2={width}
              y2={height}
            />
            <circle cx={0} cy={height} r={4} fill={theme.palette.error.main} />
            <polyline
              points={data
                .map(
                  (i, idx) =>
                    `${idx},${Math.floor((i.freemem / i.totalmem) * height)}`
                )
                .join(" ")}
              fill="none"
              pointsAtZ={50}
              z={50}
              stroke={theme.palette.primary.main}
              strokeWidth={1}
            />
            {mem.isSuccess && (
              <text
                x={12}
                y={0 + 9}
                z={100}
                fill={theme.palette.action.disabled}
                font-size="12"
                height={9}
              >
                100% ({Math.floor(mem.data.totalmem / 1024 / 1024 / 1024) + "G"}
                )
              </text>
            )}
            <text
              x={12}
              y={height / 2}
              fill={theme.palette.action.disabled}
              font-size="12"
              z={100}
            >
              50%
            </text>
            <text
              x={12}
              y={height / 4}
              z={100}
              fill={theme.palette.action.disabled}
              font-size="12"
            >
              75%
            </text>
            <text
              x={12}
              y={(height / 4) * 3}
              z={100}
              fill={theme.palette.action.disabled}
              font-size="12"
            >
              25%
            </text>
          </svg>
        </Box>
      </CardContent>
    </Card>
  );
};

export const Settings = () => {
  const hasHydrated = useIndexedStoreHasHydrated();
  if (!hasHydrated) {
    return <CircularProgress />;
  }

  return (
    <Stack spacing={6}>
      <SettingsForm />
      <MemCard />
    </Stack>
  );
};
