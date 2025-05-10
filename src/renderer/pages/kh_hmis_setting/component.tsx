import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  FormControlLabel,
  Grid,
  Checkbox,
  TextField,
  FormGroup,
  CircularProgress,
} from "@mui/material";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useNotifications } from "@toolpad/core";
import { useQuery } from "@tanstack/react-query";
import {
  fetchKhHmisSetting,
  useUpdateKhHmisSetting,
} from "@/api/fetch_preload";
import { SaveOutlined } from "@mui/icons-material";
import { NumberField } from "@/components/number";

const schema = z.object({
  ip: z
    .string()
    .ip({ message: "无效的IP地址" })
    .min(1, { message: "IP地址不能为空" }),
  port: z
    .number({ message: "端口号必须是数字" })
    .int({ message: "端口号必须是整数" })
    .min(1, { message: "端口号不能为空" })
    .max(65535, { message: "端口号不能大于65535" }),
  autoInput: z.boolean(),
  autoUpload: z.boolean(),
  autoUploadInterval: z
    .number({ message: "自动上传间隔必须是数字" })
    .int({ message: "自动上传间隔必须是整数" })
    .min(10, { message: "自动上传间隔不能小于10秒" }),
  tsgz: z.string(),
  tszjy: z.string(),
  tsysy: z.string(),
});

type FormValues = z.infer<typeof schema>;

const useSettingForm = () => {
  const { data: hmis } = useQuery(fetchKhHmisSetting());

  if (!hmis) {
    throw new Error("fetchKhHmisSetting data not found");
  }

  return useForm<FormValues>({
    defaultValues: {
      ip: hmis.host.split(":")[0],
      port: Number.parseInt(hmis.host.split(":")[1]),
      autoInput: hmis.autoInput,
      autoUpload: hmis.autoUpload,
      autoUploadInterval: hmis.autoUploadInterval,
      tsgz: hmis.tsgz,
      tszjy: hmis.tszjy,
      tsysy: hmis.tsysy,
    },
    resolver: zodResolver(schema),
  });
};

export const Component = () => {
  const formId = React.useId();

  const snackbar = useNotifications();
  const form = useSettingForm();
  const update = useUpdateKhHmisSetting();

  return (
    <Card>
      <CardHeader title="康华HMIS设置" subheader="安康" />
      <CardContent>
        <form
          id={formId}
          noValidate
          autoComplete="off"
          onSubmit={form.handleSubmit((data) => {
            update.mutate(
              {
                host: `${data.ip}:${data.port}`,
                autoInput: data.autoInput,
                autoUpload: data.autoUpload,
                autoUploadInterval: data.autoUploadInterval,
                tsgz: data.tsgz,
                tszjy: data.tszjy,
                tsysy: data.tsysy,
              },
              {
                onError: () => {
                  snackbar.show("保存失败", { severity: "error" });
                },
                onSuccess: (data) => {
                  form.reset({
                    ip: data.host.split(":")[0],
                    port: Number.parseInt(data.host.split(":")[1]),
                    autoInput: data.autoInput,
                    autoUpload: data.autoUpload,
                    autoUploadInterval: data.autoUploadInterval,
                    tsgz: data.tsgz,
                    tszjy: data.tszjy,
                    tsysy: data.tsysy,
                  });
                  snackbar.show("保存成功", { severity: "success" });
                },
              },
            );
          }, console.warn)}
        >
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={form.control}
                name="ip"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="IP地址"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={form.control}
                name="port"
                render={({ field, fieldState }) => (
                  <NumberField
                    field={field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="端口号"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={form.control}
                name="tsgz"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="探伤工长"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={form.control}
                name="tszjy"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="探伤质检员"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={form.control}
                name="tsysy"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="探伤验收员"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormGroup row>
                <Controller
                  control={form.control}
                  name="autoInput"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="自动录入"
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="autoUpload"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="自动上传"
                    />
                  )}
                />
              </FormGroup>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={form.control}
                name="autoUploadInterval"
                render={({ field, fieldState }) => (
                  <NumberField
                    field={field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="自动上传间隔"
                    fullWidth
                  />
                )}
              />
            </Grid>
          </Grid>
        </form>
      </CardContent>
      <CardActions>
        <Button
          form={formId}
          type="submit"
          disabled={update.isPending}
          startIcon={
            update.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SaveOutlined />
            )
          }
        >
          保存
        </Button>
      </CardActions>
    </Card>
  );
};
