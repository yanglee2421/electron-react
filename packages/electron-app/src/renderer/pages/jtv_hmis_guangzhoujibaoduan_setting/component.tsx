import { NumberField } from "#renderer/components/number";
import { useGuangzhoujibaoduan } from "#renderer/shared/hooks/ui/useGuangzhoujibaoduan";
import {
  guangzhoujibaoduan,
  type Guangzhoujibaoduan,
} from "#shared/instances/schema";
import { Restore, SaveOutlined } from "@mui/icons-material";
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
  const get_ip = useGuangzhoujibaoduan((store) => store.get_ip);
  const get_port = useGuangzhoujibaoduan((store) => store.get_port);
  const post_ip = useGuangzhoujibaoduan((store) => store.post_ip);
  const post_port = useGuangzhoujibaoduan((store) => store.post_port);
  const unitCode = useGuangzhoujibaoduan((store) => store.unitCode);
  const signature_prefix = useGuangzhoujibaoduan(
    (store) => store.signature_prefix,
  );
  const autoInput = useGuangzhoujibaoduan((store) => store.autoInput);
  const autoUpload = useGuangzhoujibaoduan((store) => store.autoUpload);
  const autoUploadInterval = useGuangzhoujibaoduan(
    (store) => store.autoUploadInterval,
  );

  const form = useForm({
    defaultValues: {
      get_ip,
      get_port,
      post_ip,
      post_port,
      unitCode,
      signature_prefix,
      autoInput,
      autoUpload,
      autoUploadInterval,
    } as Guangzhoujibaoduan,
    validators: {
      onChange: guangzhoujibaoduan.required(),
    },
    onSubmit: async ({ value }) => {
      useGuangzhoujibaoduan.setState((draft) => {
        draft.get_ip = value.get_ip;
        draft.get_port = value.get_port;
        draft.post_ip = value.post_ip;
        draft.post_port = value.post_port;
        draft.unitCode = value.unitCode;
        draft.signature_prefix = value.signature_prefix;
        draft.autoInput = value.autoInput;
        draft.autoUpload = value.autoUpload;
        draft.autoUploadInterval = value.autoUploadInterval;
      });

      snackbar.show("保存成功", { severity: "success" });
    },
  });

  return (
    <Card>
      <CardHeader title="京天威HMIS设置" subheader="广州机保段" />
      <CardContent>
        <form
          id={formId}
          noValidate
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          onReset={() => {
            form.reset();
          }}
        >
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field
                name="get_ip"
                children={(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="GET IP地址"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field
                name="get_port"
                children={(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: () => field.handleBlur(),
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="GET 端口号"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field
                name="post_ip"
                children={(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="POST IP地址"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field
                name="post_port"
                children={(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: () => field.handleBlur(),
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="POST 端口号"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field
                name="unitCode"
                children={(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="单位代码"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field
                name="signature_prefix"
                children={(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="签章前缀"
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
              </FormGroup>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field
                name="autoUploadInterval"
                children={(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: () => field.handleBlur(),
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
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
        <Button form={formId} type="reset" startIcon={<Restore />}>
          重置
        </Button>
      </CardActions>
    </Card>
  );
};
