import { NumberField } from "#renderer/components/number";
import { useJTVHmisStore } from "#renderer/shared/hooks/ui/useJTVHmisStore";
import { jtv_hmis, type JTV_HMIS } from "#shared/instances/schema";
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
  const ip = useJTVHmisStore((store) => store.ip);
  const port = useJTVHmisStore((store) => store.port);
  const autoInput = useJTVHmisStore((store) => store.autoInput);
  const autoUpload = useJTVHmisStore((store) => store.autoUpload);
  const autoUploadInterval = useJTVHmisStore(
    (store) => store.autoUploadInterval,
  );
  const unitCode = useJTVHmisStore((store) => store.unitCode);
  const signature_prefix = useJTVHmisStore((store) => store.signature_prefix);

  const form = useForm({
    defaultValues: {
      ip,
      port,
      autoInput,
      autoUpload,
      autoUploadInterval,
      unitCode,
      signature_prefix,
    } as JTV_HMIS,
    validators: {
      onChange: jtv_hmis.required(),
    },
    onSubmit: ({ value }) => {
      useJTVHmisStore.setState((draft) => {
        draft.ip = value.ip;
        draft.port = value.port;
        draft.autoInput = value.autoInput;
        draft.autoUpload = value.autoUpload;
        draft.autoUploadInterval = value.autoUploadInterval;
        draft.unitCode = value.unitCode;
        draft.signature_prefix = value.signature_prefix;
      });

      snackbar.show("设置已保存", { severity: "success" });
    },
  });

  return (
    <Card>
      <CardHeader title="京天威HMIS设置" subheader="统型" />
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
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="IP地址"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="port">
                {(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: () => field.handleBlur(),
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="端口号"
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
                      onBlur: () => field.handleBlur(),
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
