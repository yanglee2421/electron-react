import { NumberField } from "#renderer/components/number";
import { useKhHmisStore } from "#renderer/hooks/stores/useKhHmisStore";
import { kh_hmis } from "#shared/instances/schema";
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
  const ip = useKhHmisStore((store) => store.ip);
  const port = useKhHmisStore((store) => store.port);
  const autoInput = useKhHmisStore((store) => store.autoInput);
  const autoUpload = useKhHmisStore((store) => store.autoUpload);
  const autoUploadInterval = useKhHmisStore(
    (store) => store.autoUploadInterval,
  );
  const tsgz = useKhHmisStore((store) => store.tsgz);
  const tszjy = useKhHmisStore((store) => store.tszjy);
  const tsysy = useKhHmisStore((store) => store.tsysy);
  const tswxg = useKhHmisStore((store) => store.tswxg);
  const zgld = useKhHmisStore((store) => store.zgld);
  const sbzz = useKhHmisStore((store) => store.sbzz);
  const tszz = useKhHmisStore((store) => store.tszz);

  const form = useForm({
    defaultValues: {
      ip,
      port,
      autoInput,
      autoUpload,
      autoUploadInterval,
      tsgz,
      tszjy,
      tsysy,
      tswxg,
      tszz,
      zgld,
      sbzz,
    },
    validators: {
      onChange: kh_hmis.required(),
    },
    onSubmit: ({ value }) => {
      useKhHmisStore.setState((draft) => {
        draft.ip = value.ip;
        draft.port = value.port;
        draft.autoInput = value.autoInput;
        draft.autoUpload = value.autoUpload;
        draft.autoUploadInterval = value.autoUploadInterval;
        draft.tsgz = value.tsgz;
        draft.tszjy = value.tszjy;
        draft.tsysy = value.tsysy;
        draft.tswxg = value.tswxg;
        draft.zgld = value.zgld;
        draft.sbzz = value.sbzz;
        draft.tszz = value.tszz;
      });
      snackbar.show("保存成功", { severity: "success" });
    },
  });

  return (
    <Card>
      <CardHeader title="康华HMIS设置" subheader="安康" />
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
              <form.Field name="ip">
                {(field) => (
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
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="port">
                {(field) => (
                  <NumberField
                    field={{
                      value: field.state.value,
                      onChange: (value) => field.handleChange(value),
                      onBlur: field.handleBlur,
                    }}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="端口号"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="tsgz">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="探伤工长"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="tszjy">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="探伤质检员"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="tswxg">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="维修工"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="tsysy">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="探伤验收员"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="tszz">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="探伤专职"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="sbzz">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="设备专职"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="zgld">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={field.state.meta.errors.at(0)?.message}
                    label="主管领导"
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
                    helperText={field.state.meta.errors.at(0)?.message}
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
