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
  fetchJtvHmisGuangzhoubeiSetting,
  useUpdateJtvHmisGuangzhoubeiSetting,
} from "#renderer/api/fetch_preload";
import { SaveOutlined } from "@mui/icons-material";
import { NumberField } from "#renderer/components/number";

const schema = z.object({
  get_ip: z.ipv4(),
  get_port: z.number().int().min(1).max(65535),
  post_ip: z.ipv4(),
  post_port: z.number().int().min(1).max(65535),
  autoInput: z.boolean(),
  autoUpload: z.boolean(),
  autoUploadInterval: z.number().int().min(10),
  unitCode: z.string(),
});

type FormValues = z.infer<typeof schema>;

const useSettingForm = () => {
  const { data: hmis } = useQuery(fetchJtvHmisGuangzhoubeiSetting());

  if (!hmis) {
    throw new Error("fetchJtvHmisSetting data not found");
  }

  return useForm<FormValues>({
    defaultValues: {
      get_ip: hmis.get_host.split(":")[0],
      get_port: Number.parseInt(hmis.get_host.split(":")[1]),
      post_ip: hmis.post_host.split(":")[0],
      post_port: Number.parseInt(hmis.post_host.split(":")[1]),
      autoInput: hmis.autoInput,
      autoUpload: hmis.autoUpload,
      autoUploadInterval: hmis.autoUploadInterval,
      unitCode: hmis.unitCode,
    },

    resolver: zodResolver(schema),
  });
};

export const Component = () => {
  const formId = React.useId();

  const snackbar = useNotifications();
  const form = useSettingForm();
  const updateSettings = useUpdateJtvHmisGuangzhoubeiSetting();

  return (
    <Card>
      <CardHeader title="京天威HMIS设置" subheader="统型" />
      <CardContent>
        <form
          id={formId}
          noValidate
          autoComplete="off"
          onSubmit={form.handleSubmit((data) => {
            updateSettings.mutate(
              {
                get_host: `${data.get_ip}:${data.get_port}`,
                post_host: `${data.post_ip}:${data.post_port}`,
                autoInput: data.autoInput,
                autoUpload: data.autoUpload,
                autoUploadInterval: data.autoUploadInterval,
                unitCode: data.unitCode,
              },
              {
                onError: (error) => {
                  snackbar.show(error.message, { severity: "error" });
                },
                onSuccess: (data) => {
                  form.reset({
                    get_ip: data.get_host.split(":")[0],
                    get_port: Number.parseInt(data.get_host.split(":")[1]),
                    post_ip: data.post_host.split(":")[0],
                    post_port: Number.parseInt(data.post_host.split(":")[1]),
                    autoInput: data.autoInput,
                    autoUpload: data.autoUpload,
                    autoUploadInterval: data.autoUploadInterval,
                    unitCode: data.unitCode,
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
                name="get_ip"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="GET IP地址"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={form.control}
                name="get_port"
                render={({ field, fieldState }) => (
                  <NumberField
                    field={field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="GET 端口号"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={form.control}
                name="post_ip"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="POST IP地址"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={form.control}
                name="post_port"
                render={({ field, fieldState }) => (
                  <NumberField
                    field={field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="POST 端口号"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={form.control}
                name="unitCode"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="单位代码"
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
          disabled={updateSettings.isPending}
          startIcon={
            updateSettings.isPending ? (
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
