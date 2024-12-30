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
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import * as channel from "@electron/channel";

const schema = z.object({
  path: z.string().min(1),
  dsn: z.string().min(1),
});

const SettingsForm = () => {
  const settings = useIndexedStore((s) => s.settings);
  const set = useIndexedStore((s) => s.set);
  const form = useForm({
    defaultValues: {
      path: settings.databasePath,
      dsn: settings.databaseDsn,
    },

    resolver: zodResolver(schema),
  });

  const formId = React.useId();
  const [isPending, startTransition] = React.useTransition();

  return (
    <Card>
      <CardHeader
        title="Settings"
        action={
          <IconButton
            disabled={isPending}
            onClick={() => {
              startTransition(() =>
                window.ipcRenderer.invoke(channel.openDevTools)
              );
            }}
          >
            <BugReportOutlined />
          </IconButton>
        }
      />
      <CardContent>
        <form
          id={formId}
          action={() =>
            form.handleSubmit((data) => {
              set((d) => {
                d.settings.databasePath = data.path;
                d.settings.databaseDsn = data.dsn;
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
                                  console.log();
                                  const file = e.target.files?.item(0);
                                  if (!file) return;
                                  field.onChange(file.path);
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
          </Grid2>
        </form>
      </CardContent>
      <CardActions>
        <Button
          type="submit"
          form={formId}
          variant="contained"
          startIcon={<SaveOutlined />}
        >
          Save
        </Button>
        <Button
          component="label"
          startIcon={<FileDownloadOutlined />}
          variant="outlined"
        >
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
            const version = useIndexedStore.persist.getOptions().version || 0;

            // 将 JSON 数据转换为字符串
            const jsonString = JSON.stringify(data, null, 2);

            // 创建 Blob 对象
            const blob = new Blob([jsonString], { type: "application/json" });

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
          variant="outlined"
        >
          export
        </Button>
      </CardActions>
    </Card>
  );
};
// Joney

export const Settings = () => {
  const hasHydrated = useIndexedStoreHasHydrated();
  if (hasHydrated) {
    return <SettingsForm />;
  }
  return <CircularProgress />;
};
