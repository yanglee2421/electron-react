import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  TextField,
} from "@mui/material";
import { z } from "zod";
import React from "react";
import { useNotifications } from "@toolpad/core";
import { useQuery } from "@tanstack/react-query";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { fetchPLCReadTest, usePLCWriteTest } from "#renderer/api/fetch_preload";
import { NumberField } from "#renderer/components/number";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    NumberField,
  },
  formComponents: {
    Button,
  },
});

const schema = z.object({
  D300: z.number().min(0).int(),
  D301: z.number().min(0).int(),
  D302: z.number().min(0).int(),
  D303: z.number().min(0).int(),
  D308: z.number().min(0).int(),
  D309: z.number().min(0).int(),
});

export const Component = () => {
  const formId = React.useId();

  const query = useQuery({ ...fetchPLCReadTest(), refetchInterval: 1000 });
  const plcWriteTest = usePLCWriteTest();
  const notifications = useNotifications();

  const form = useAppForm({
    defaultValues: {
      D300: query.data?.D300 ?? 0,
      D301: query.data?.D301 ?? 0,
      D302: query.data?.D302 ?? 0,
      D303: query.data?.D303 ?? 0,
      D308: query.data?.D308 ?? 0,
      D309: query.data?.D309 ?? 0,
    },
    onSubmit: async ({ value }) => {
      await plcWriteTest.mutateAsync(value, {
        onError: (error) => {
          notifications.show(error.message, { severity: "error" });
        },
        onSuccess: () => {
          notifications.show("保存成功", { severity: "success" });
        },
      });
    },
    validators: { onChange: schema },
  });

  if (query.isPending) {
    return <CircularProgress />;
  }

  if (query.isError) {
    return query.error.message;
  }

  return (
    <Card>
      <CardHeader title="PLC" />
      <CardContent>
        <form
          id={formId}
          onSubmit={(e) => {
            e.stopPropagation();
            e.preventDefault();
            form.handleSubmit();
          }}
          onReset={() => {
            form.reset();
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
              <TextField
                value={query.data.D20}
                fullWidth
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
                label="左轴身实际值D20"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
              <TextField
                value={query.data.D21}
                fullWidth
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
                label="右轴身实际值D21"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
              <TextField
                value={query.data.D22}
                fullWidth
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
                label="左端面实际值D22"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
              <TextField
                value={query.data.D23}
                fullWidth
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
                label="右端面实际值D23"
              />
            </Grid>
            <Grid size={12}>
              <Divider>分隔线</Divider>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
              <form.AppField name="D300">
                {(field) => {
                  return (
                    <field.NumberField
                      fullWidth
                      label="左轴身降起始值D300"
                      placeholder={query.data.D300 + ""}
                      field={{
                        value: field.state.value,
                        onChange: field.handleChange,
                        onBlur: field.handleBlur,
                      }}
                      _min={0}
                      error={field.state.meta.errors.length > 0}
                      helperText={field.state.meta.errors.at(0)?.message}
                    />
                  );
                }}
              </form.AppField>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
              <form.AppField name="D301">
                {(field) => {
                  return (
                    <field.NumberField
                      fullWidth
                      label="右轴身降起始值D301"
                      placeholder={query.data.D301 + ""}
                      field={{
                        value: field.state.value,
                        onChange: field.handleChange,
                        onBlur: field.handleBlur,
                      }}
                      _min={0}
                      error={field.state.meta.errors.length > 0}
                      helperText={field.state.meta.errors.at(0)?.message}
                    />
                  );
                }}
              </form.AppField>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
              <form.AppField name="D302">
                {(field) => {
                  return (
                    <field.NumberField
                      fullWidth
                      label="左端面降起始值D302"
                      placeholder={query.data.D302 + ""}
                      field={{
                        value: field.state.value,
                        onChange: field.handleChange,
                        onBlur: field.handleBlur,
                      }}
                      _min={0}
                      error={field.state.meta.errors.length > 0}
                      helperText={field.state.meta.errors.at(0)?.message}
                    />
                  );
                }}
              </form.AppField>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
              <form.AppField name="D303">
                {(field) => {
                  return (
                    <field.NumberField
                      fullWidth
                      label="右端面降起始值D303"
                      placeholder={query.data.D303 + ""}
                      field={{
                        value: field.state.value,
                        onChange: field.handleChange,
                        onBlur: field.handleBlur,
                      }}
                      _min={0}
                      error={field.state.meta.errors.length > 0}
                      helperText={field.state.meta.errors.at(0)?.message}
                    />
                  );
                }}
              </form.AppField>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
              <form.AppField name="D308">
                {(field) => {
                  return (
                    <field.NumberField
                      fullWidth
                      label="左轴身差值D308"
                      placeholder={query.data.D308 + ""}
                      field={{
                        value: field.state.value,
                        onChange: field.handleChange,
                        onBlur: field.handleBlur,
                      }}
                      _min={0}
                      error={field.state.meta.errors.length > 0}
                      helperText={field.state.meta.errors.at(0)?.message}
                    />
                  );
                }}
              </form.AppField>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
              <form.AppField name="D309">
                {(field) => {
                  return (
                    <field.NumberField
                      fullWidth
                      label="右轴身差值D309"
                      placeholder={query.data.D309 + ""}
                      field={{
                        value: field.state.value,
                        onChange: field.handleChange,
                        onBlur: field.handleBlur,
                      }}
                      _min={0}
                      error={field.state.meta.errors.length > 0}
                      helperText={field.state.meta.errors.at(0)?.message}
                    />
                  );
                }}
              </form.AppField>
            </Grid>
          </Grid>
        </form>
      </CardContent>
      <CardActions>
        <Button type="submit" form={formId} disabled={plcWriteTest.isPending}>
          保存
        </Button>
        <Button type="reset" form={formId}>
          重置
        </Button>
      </CardActions>
    </Card>
  );
};
