import { useIndexedStore } from "@/hooks/useIndexedStore";
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
  Stack,
  MenuItem,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import * as channel from "@electron/channel";
import { ipcRenderer, webUtils } from "@/lib/utils";
import { useSnackbar } from "notistack";

const schema = z.object({
  databasePath: z.string().min(1, { message: "数据库路径不能为空" }),
  driverPath: z.string().min(1, { message: "驱动路径不能为空" }),
  home_path: z.string().min(1, { message: "主页路径不能为空" }),
});

type FormValues = z.infer<typeof schema>;

const useSettingForm = (defaultValues: FormValues) =>
  useForm<FormValues>({
    defaultValues,

    resolver: zodResolver(schema),
  });

export const Component = () => {
  const formId = React.useId();

  const [isPending, startTransition] = React.useTransition();

  const settings = useIndexedStore((s) => s.settings);
  const set = useIndexedStore((s) => s.set);
  const form = useSettingForm(settings);
  const snackbar = useSnackbar();

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit((data) => {
        set((d) => {
          d.settings = { ...d.settings, ...data };
        });
        snackbar.enqueueSnackbar("保存成功", { variant: "success" });
      }, console.warn)}
      onReset={() => form.reset()}
      noValidate
      autoComplete="off"
    >
      <Stack spacing={6}>
        <Card>
          <CardHeader
            title="设置"
            action={
              <IconButton
                disabled={isPending}
                onClick={() => {
                  startTransition(() =>
                    ipcRenderer.invoke(channel.openDevTools)
                  );
                }}
              >
                <BugReportOutlined />
              </IconButton>
            }
          />
          <CardContent>
            <Grid2 container spacing={3}>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={form.control}
                  name="databasePath"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      label="数据库路径"
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
                  name="driverPath"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      label="驱动路径"
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton component="label">
                                <input
                                  type="file"
                                  accept="application/x-msdownload,.exe"
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
                  name="home_path"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      label="主页路径"
                      select
                    >
                      <MenuItem value="/settings">设置</MenuItem>
                      <MenuItem value="/detection">现车作业</MenuItem>
                      <MenuItem value="/quartors">季度校验</MenuItem>
                      <MenuItem value="/log">日志</MenuItem>
                      <MenuItem value="/hxzy_hmis">华兴致远HMIS</MenuItem>
                      <MenuItem value="/hxzy_hmis_setting">
                        华兴致远HMIS设置
                      </MenuItem>
                      <MenuItem value="/hxzy_verifies">
                        华兴致远日常校验
                      </MenuItem>
                    </TextField>
                  )}
                />
              </Grid2>
            </Grid2>
          </CardContent>
          <CardActions>
            <Button type="submit" form={formId} startIcon={<SaveOutlined />}>
              保存
            </Button>
            <Button
              component="label"
              startIcon={<FileDownloadOutlined />}
              sx={{ display: "none" }}
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
              导入
            </Button>
            <Button
              onClick={() => {
                const data = useIndexedStore.getState();
                const version =
                  useIndexedStore.persist.getOptions().version || 0;
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], {
                  type: "application/json",
                });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `backup-v${version}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              startIcon={<FileUploadOutlined />}
              sx={{ display: "none" }}
            >
              导出
            </Button>
          </CardActions>
        </Card>
      </Stack>
    </form>
  );
};
