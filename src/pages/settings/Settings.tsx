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
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import * as channel from "@electron/channel";
import { ipcRenderer, webUtils } from "@/lib/utils";
import { useSnackbar } from "notistack";
import { ActivateCard } from "./ActivateCard";

const schema = z.object({
  databasePath: z.string().min(1, { message: "数据库路径不能为空" }),
  driverPath: z.string().min(1, { message: "驱动路径不能为空" }),
  api_ip: z.string().ip({ message: "IP 地址格式不正确" }),
  api_port: z
    .string()
    .refine((v) => z.number().int().min(1).max(65535).safeParse(+v).success, {
      message: "端口号必须是 1-65535 的整数",
    }),
  autoInput: z.boolean(),
  autoUpload: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const useSettingForm = (defaultValues: FormValues) =>
  useForm<FormValues>({
    defaultValues,

    resolver: zodResolver(schema),
  });

export const Settings = () => {
  const formId = React.useId();

  const [isPending, startTransition] = React.useTransition();

  const settings = useIndexedStore((s) => s.settings);
  const set = useIndexedStore((s) => s.set);
  const form = useSettingForm(settings);
  const toast = useSnackbar();

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit((data) => {
        set((d) => {
          d.settings = { ...d.settings, ...data };
        });
        toast.enqueueSnackbar("保存成功", { variant: "success" });
      }, console.warn)}
      onReset={() => form.reset()}
      noValidate
      autoComplete="off"
    >
      <Stack spacing={6}>
        <Card>
          <CardHeader
            title="常规设置"
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
            </Grid2>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="HMIS/KMIS设置" />
          <CardContent>
            <Grid2 container spacing={3}>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={form.control}
                  name="api_ip"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      label="接口 IP"
                    />
                  )}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={form.control}
                  name="api_port"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      label="接口端口"
                    />
                  )}
                />
              </Grid2>
              <Grid2 size={12}>
                <FormGroup row>
                  <Controller
                    control={form.control}
                    name="autoInput"
                    render={({ field }) => (
                      <FormControlLabel
                        label="自动录入"
                        control={
                          <Checkbox
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                            }}
                          />
                        }
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="autoUpload"
                    render={({ field }) => (
                      <FormControlLabel
                        label="自动上传"
                        control={
                          <Checkbox
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                            }}
                          />
                        }
                      />
                    )}
                  />
                </FormGroup>
              </Grid2>
            </Grid2>
          </CardContent>
        </Card>
        <ActivateCard />
        <Card>
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
        </Card>
      </Stack>
    </form>
  );
};
