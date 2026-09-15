import { NumberField } from "#renderer/components/number";
import { useFuzhoudong } from "#renderer/hooks/stores/useFuzhoudong";
import { fuzhoudong } from "#shared/instances/schema";
import { SaveOutlined } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  FormLabel,
  Grid,
  TextField,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import React from "react";
import { toast } from "react-toastify";

export const Component = () => {
  const formId = React.useId();

  const ip = useFuzhoudong((s) => s.ip);
  const port = useFuzhoudong((s) => s.port);

  const form = useForm({
    defaultValues: {
      ip,
      port,
    },
    validators: {
      onChange: fuzhoudong.required(),
    },
    onSubmit: ({ value }) => {
      useFuzhoudong.setState((draft) => {
        draft.ip = value.ip;
        draft.port = value.port;
      });
      toast.success("保存成功");
    },
  });

  return (
    <Card>
      <CardHeader title="HMIS设置" subheader="福州东车辆段" />
      <CardContent>
        <form
          id={formId}
          noValidate
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <Grid container spacing={1.5}>
            <Grid size={12}>
              <FormLabel>网络相关</FormLabel>
            </Grid>
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
