import { NumberField } from "#renderer/components/number";
import { useGuangzhoucheliang } from "#renderer/hooks/stores/useGuangzhoucheliang";
import type { GuangzhoucheliangType } from "#shared/instances/schema";
import { guangzhoucheliang } from "#shared/instances/schema";
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
  FormLabel,
  Grid,
  TextField,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import React from "react";
import { toast } from "react-toastify";

export const Component = () => {
  const formId = React.useId();

  const scanner_ip = useGuangzhoucheliang((s) => s.scanner_ip);
  const scanner_port = useGuangzhoucheliang((s) => s.scanner_port);
  const upload_ip = useGuangzhoucheliang((s) => s.upload_ip);
  const upload_port = useGuangzhoucheliang((s) => s.upload_port);
  const autoInputEnabled = useGuangzhoucheliang((s) => s.autoInputEnabled);
  const autoUploadEnabled = useGuangzhoucheliang((s) => s.autoUploadEnabled);
  const autoUploadInterval = useGuangzhoucheliang((s) => s.autoUploadInterval);
  const autoSubmitEnabled = useGuangzhoucheliang((s) => s.autoSubmitEnabled);
  const autoSubmitDelay = useGuangzhoucheliang((s) => s.autoSubmitDelay);
  const signature_prefix = useGuangzhoucheliang((s) => s.signature_prefix);
  const gd = useGuangzhoucheliang((s) => s.gd);

  const form = useForm({
    defaultValues: {
      ...useGuangzhoucheliang.getState(),
      scanner_ip,
      scanner_port,
      upload_ip,
      upload_port,
      autoInputEnabled,
      autoUploadEnabled,
      autoUploadInterval,
      autoSubmitEnabled,
      autoSubmitDelay,
      signature_prefix,
      gd,
    } as GuangzhoucheliangType,
    validators: {
      onChange: guangzhoucheliang.required(),
    },
    onSubmit: ({ value }) => {
      useGuangzhoucheliang.setState((draft) => {
        draft.scanner_ip = value.scanner_ip;
        draft.scanner_port = value.scanner_port;
        draft.upload_ip = value.upload_ip;
        draft.upload_port = value.upload_port;
        draft.autoInputEnabled = value.autoInputEnabled;
        draft.autoUploadEnabled = value.autoUploadEnabled;
        draft.autoUploadInterval = value.autoUploadInterval;
        draft.autoSubmitEnabled = value.autoSubmitEnabled;
        draft.autoSubmitDelay = value.autoSubmitDelay;
        draft.signature_prefix = value.signature_prefix;
        draft.gd = value.gd;
      });
      toast.success("设置已保存");
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
            <Grid size={12}>
              <FormLabel>网络</FormLabel>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="scanner_ip">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="扫码IP"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="scanner_port">
                {(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: () => field.handleBlur(),
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="扫码端口"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="upload_ip">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="上传IP"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="upload_port">
                {(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: () => field.handleBlur(),
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="上传端口"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={12}>
              <FormLabel>上传</FormLabel>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="gd">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors[0]?.message}
                    label="股道"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={12}>
              <FormLabel>其它</FormLabel>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormGroup row>
                <form.Field name="autoInputEnabled">
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
                <form.Field name="autoUploadEnabled">
                  {(field) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.state.value}
                          onChange={(_, checked) => field.handleChange(checked)}
                        />
                      }
                      label="自动上传"
                    />
                  )}
                </form.Field>
                <form.Field name="autoSubmitEnabled">
                  {(field) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.state.value}
                          onChange={(_, checked) => {
                            field.handleChange(checked);
                          }}
                        />
                      }
                      label="启用自动提交"
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