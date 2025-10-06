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
  fetchJtvHmisSetting,
  useUpdateJtvHmisSetting,
} from "@/api/fetch_preload";
import { SaveOutlined } from "@mui/icons-material";
import { NumberField } from "@/components/number";

const schema = z.object({
  ip: z.ipv4(),
  port: z.number().int().min(1).max(65535),
  autoInput: z.boolean(),
  autoUpload: z.boolean(),
  autoUploadInterval: z.number().int().min(10),
  unitCode: z.string(),
});

type FormValues = z.infer<typeof schema>;

const useSettingForm = () => {
  const { data: hmis } = useQuery(fetchJtvHmisSetting());

  if (!hmis) {
    throw new Error("fetchJtvHmisSetting data not found");
  }

  return useForm<FormValues>({
    defaultValues: {
      ip: hmis.host.split(":")[0],
      port: Number.parseInt(hmis.host.split(":")[1]),
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
  const updateSettings = useUpdateJtvHmisSetting();

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
                host: `${data.ip}:${data.port}`,
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
                    ip: data.host.split(":")[0],
                    port: Number.parseInt(data.host.split(":")[1]),
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
