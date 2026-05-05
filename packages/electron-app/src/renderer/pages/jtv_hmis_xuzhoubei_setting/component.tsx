import { NumberField } from "#renderer/components/number";
import { useXuzhoubei } from "#renderer/hooks/stores/useXuzhoubei";
import { jtv_hmis_xuzhoubei } from "#shared/instances/schema";
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
  const ip = useXuzhoubei((store) => store.ip);
  const port = useXuzhoubei((store) => store.port);
  const autoInput = useXuzhoubei((store) => store.autoInput);
  const autoUpload = useXuzhoubei((store) => store.autoUpload);
  const autoUploadInterval = useXuzhoubei((store) => store.autoUploadInterval);
  const username_prefix = useXuzhoubei((store) => store.username_prefix);

  const form = useForm({
    defaultValues: {
      ip: ip,
      port: port,
      autoInput: autoInput,
      autoUpload: autoUpload,
      autoUploadInterval: autoUploadInterval,
      username_prefix: username_prefix,
    },
    validators: { onChange: jtv_hmis_xuzhoubei.required() },
    onSubmit: ({ value }) => {
      useXuzhoubei.setState((draft) => {
        draft.ip = value.ip;
        draft.port = value.port;
        draft.autoInput = value.autoInput;
        draft.autoUpload = value.autoUpload;
        draft.autoUploadInterval = value.autoUploadInterval;
        draft.username_prefix = value.username_prefix;
      });

      snackbar.show("保存成功", { severity: "success" });
    },
  });

  return (
    <Card>
      <CardHeader title="京天威HMIS设置" subheader="徐州北" />
      <CardContent>
        <form
          id={formId}
          noValidate
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="ip">
                {(field) => {
                  return (
                    <TextField
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      name={field.name}
                      error={!!field.state.meta.errors.length}
                      helperText={field.state.meta.errors?.[0]?.message}
                      label="IP地址"
                      fullWidth
                    />
                  );
                }}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="port">
                {(field) => {
                  return (
                    <NumberField
                      field={{
                        value: field.state.value,
                        onChange: (value) => field.handleChange(value),
                        onBlur: field.handleBlur,
                      }}
                      name={field.name}
                      error={!!field.state.meta.errors.length}
                      helperText={field.state.meta.errors?.[0]?.message}
                      label="端口号"
                      fullWidth
                    />
                  );
                }}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="username_prefix">
                {(field) => {
                  return (
                    <TextField
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      name={field.name}
                      error={!!field.state.meta.errors.length}
                      helperText={field.state.meta.errors?.[0]?.message}
                      label="用户名前缀"
                      fullWidth
                    />
                  );
                }}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormGroup row>
                <form.Field name="autoInput">
                  {(field) => (
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
                </form.Field>
                <form.Field name="autoUpload">
                  {(field) => (
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
                </form.Field>
              </FormGroup>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="autoUploadInterval">
                {(field) => {
                  return (
                    <NumberField
                      field={{
                        value: field.state.value,
                        onChange: (value) => field.handleChange(value),
                        onBlur: field.handleBlur,
                      }}
                      name={field.name}
                      error={!!field.state.meta.errors.length}
                      helperText={field.state.meta.errors?.[0]?.message}
                      label="自动上传间隔"
                      fullWidth
                    />
                  );
                }}
              </form.Field>
            </Grid>
          </Grid>
        </form>
      </CardContent>
      <CardActions>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => {
            return (
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
            );
          }}
        </form.Subscribe>
      </CardActions>
    </Card>
  );
};
