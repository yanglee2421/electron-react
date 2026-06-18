import { NumberField } from "#renderer/components/number";
import { useHxzyHmisStore } from "#renderer/hooks/stores/useHxzyHmisStore";
import { hxzy_hmis, type HXZY_HMIS } from "#shared/instances/schema";
import { SaveOutlined } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Grid,
  TextField,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useNotifications } from "@toolpad/core";
import React from "react";

export const Component = () => {
  const formId = React.useId();

  const snackbar = useNotifications();
  const ip = useHxzyHmisStore((s) => s.ip);
  const port = useHxzyHmisStore((s) => s.port);
  const autoInput = useHxzyHmisStore((s) => s.autoInput);
  const autoUpload = useHxzyHmisStore((s) => s.autoUpload);
  const autoUploadInterval = useHxzyHmisStore((s) => s.autoUploadInterval);
  const enableAutoSubmit = useHxzyHmisStore((s) => s.enableAutoSubmit);
  const autoSubmitDelay = useHxzyHmisStore((s) => s.autoSubmitDelay);
  const gd = useHxzyHmisStore((s) => s.gd);

  const form = useForm({
    defaultValues: {
      ip,
      port,
      autoInput,
      autoUpload,
      autoUploadInterval,
      enableAutoSubmit,
      autoSubmitDelay,
      gd,
    } as HXZY_HMIS,
    validators: {
      onChange: hxzy_hmis.required(),
    },
    onSubmit: ({ value }) => {
      useHxzyHmisStore.setState((draft) => {
        draft.ip = value.ip;
        draft.port = value.port;
        draft.autoInput = value.autoInput;
        draft.autoUpload = value.autoUpload;
        draft.autoUploadInterval = value.autoUploadInterval;
        draft.enableAutoSubmit = value.enableAutoSubmit;
        draft.autoSubmitDelay = value.autoSubmitDelay;
        draft.gd = value.gd;
      });
      snackbar.show("保存成功", { severity: "success" });
    },
  });

  return (
    <Card>
      <CardHeader title="华兴致远HMIS设置" subheader="成都北" />
      <CardContent>
        <form
          id={formId}
          noValidate
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field
                name="ip"
                children={(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="IP地址"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field
                name="port"
                children={(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: () => field.handleBlur(),
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="端口号"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field
                name="gd"
                children={(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="股道"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormGroup row>
                <form.Field
                  name="autoInput"
                  children={(field) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.state.value}
                          onChange={(e) => field.handleChange(e.target.checked)}
                        />
                      }
                      label="自动录入"
                    />
                  )}
                />
                <form.Field
                  name="autoUpload"
                  children={(field) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.state.value}
                          onChange={(e) => field.handleChange(e.target.checked)}
                        />
                      }
                      label="自动上传"
                    />
                  )}
                />
                <form.Field
                  name="enableAutoSubmit"
                  children={(field) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.state.value}
                          onChange={(e) => field.handleChange(e.target.checked)}
                        />
                      }
                      label="启用自动提交"
                    />
                  )}
                />
              </FormGroup>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="autoUploadInterval">
                {(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: () => field.handleBlur(),
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="自动上传间隔 ( 秒 )"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="autoSubmitDelay">
                {(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: () => field.handleBlur(),
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={
                      field.state.meta.errors[0]?.message ||
                      "条形输入一段时间后自动提交查询, 适用于扫码枪不支持自动回车的情况"
                    }
                    label="自动提交延迟 ( 毫秒 )"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
          </Grid>
        </form>
      </CardContent>
      <CardActions>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              form={formId}
              type="submit"
              disabled={!canSubmit}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SaveOutlined />
                )
              }
            >
              保存
            </Button>
          )}
        </form.Subscribe>
      </CardActions>
    </Card>
  );
};
