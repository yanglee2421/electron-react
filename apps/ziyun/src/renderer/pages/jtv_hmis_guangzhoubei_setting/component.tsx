import { NumberField } from "#renderer/components/number";
import { useGuangzhoubei } from "#renderer/hooks/stores/useGuangzhoubei";
import type { JTV_HMIS_Guangzhoubei } from "#shared/instances/schema";
import { jtv_hmis_guangzhoubei } from "#shared/instances/schema";
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
  const get_ip = useGuangzhoubei((store) => store.get_ip);
  const get_port = useGuangzhoubei((store) => store.get_port);
  const post_ip = useGuangzhoubei((store) => store.post_ip);
  const post_port = useGuangzhoubei((store) => store.post_port);
  const autoInput = useGuangzhoubei((store) => store.autoInput);
  const autoUpload = useGuangzhoubei((store) => store.autoUpload);
  const autoUploadInterval = useGuangzhoubei(
    (store) => store.autoUploadInterval,
  );
  const unitCode = useGuangzhoubei((store) => store.unitCode);
  const signature_prefix = useGuangzhoubei((store) => store.signature_prefix);
  const isZhMode = useGuangzhoubei((store) => store.isZhMode);

  const form = useForm({
    defaultValues: {
      get_ip,
      get_port,
      post_ip,
      post_port,
      autoInput,
      autoUpload,
      autoUploadInterval,
      unitCode,
      signature_prefix,
      isZhMode,
    } as JTV_HMIS_Guangzhoubei,
    validators: {
      onChange: jtv_hmis_guangzhoubei.required(),
    },
    onSubmit: ({ value }) => {
      useGuangzhoubei.setState((draft) => {
        draft.get_ip = value.get_ip;
        draft.get_port = value.get_port;
        draft.post_ip = value.post_ip;
        draft.post_port = value.post_port;
        draft.autoInput = value.autoInput;
        draft.autoUpload = value.autoUpload;
        draft.autoUploadInterval = value.autoUploadInterval;
        draft.unitCode = value.unitCode;
        draft.signature_prefix = value.signature_prefix;
      });
      snackbar.show("保存成功", { severity: "success" });
    },
  });

  return (
    <Card>
      <CardHeader title="京天威HMIS设置" subheader="广州北" />
      <CardContent>
        <form
          id={formId}
          noValidate
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="get_ip">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="GET IP地址"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="get_port">
                {(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: field.handleBlur,
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="GET 端口号"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="post_ip">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="POST IP地址"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="post_port">
                {(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: field.handleBlur,
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="POST 端口号"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="unitCode">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="单位代码"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="signature_prefix">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    name={field.name}
                    label="签章前缀"
                    fullWidth
                  />
                )}
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
                {(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: field.handleBlur,
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="自动上传间隔"
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
