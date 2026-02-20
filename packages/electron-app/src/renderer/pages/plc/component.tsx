import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { z } from "zod";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNotifications } from "@toolpad/core";
import { Refresh, Replay, Restore, Save } from "@mui/icons-material";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { NumberField } from "#renderer/components/number";
import {
  fetchPLCReadTest,
  fetchSerialPortList,
  usePLCWriteTest,
} from "#renderer/api/fetch_preload";

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

type ErrorAlertProps = {
  error: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
};

const ErrorAlert = (props: ErrorAlertProps) => {
  const { error } = props;

  const content =
    error instanceof Error ? (
      <>
        <Typography>{error.message}</Typography>
        <Typography variant="body2">{error.stack}</Typography>
      </>
    ) : (
      <Typography>未知错误，请联系服务人员</Typography>
    );

  return (
    <Alert severity="error" variant="outlined">
      <AlertTitle>错误</AlertTitle>
      {content}
      <Button
        onClick={props.onRetry}
        disabled={props.isRetrying}
        startIcon={
          props.isRetrying ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <Replay />
          )
        }
        color="error"
      >
        重试
      </Button>
    </Alert>
  );
};

export const Component = () => {
  const [serialPort, setSerialPort] = React.useState("");

  const formId = React.useId();

  const serialPorts = useQuery(fetchSerialPortList());

  const serialPortPath = serialPort || serialPorts.data?.at(0)?.path || "";

  const plcReadTest = useQuery({
    ...fetchPLCReadTest(serialPortPath),
    refetchInterval: (query) => {
      if (query.state.fetchFailureCount > 1) {
        return false;
      }

      return 1000;
    },
    enabled: !!serialPortPath,
  });
  const plcWriteTest = usePLCWriteTest();
  const notifications = useNotifications();

  const form = useAppForm({
    defaultValues: {
      D300: plcReadTest.data?.D300 ?? 0,
      D301: plcReadTest.data?.D301 ?? 0,
      D302: plcReadTest.data?.D302 ?? 0,
      D303: plcReadTest.data?.D303 ?? 0,
      D308: plcReadTest.data?.D308 ?? 0,
      D309: plcReadTest.data?.D309 ?? 0,
    },
    onSubmit: async ({ value }) => {
      await plcWriteTest.mutateAsync(
        { path: serialPortPath, ...value },
        {
          onError: (error) => {
            notifications.show(error.message, { severity: "error" });
          },
          onSuccess: () => {
            notifications.show("保存成功", { severity: "success" });
          },
        },
      );
    },
    validators: { onChange: schema },
  });

  const renderPLCReadQuery = () => {
    if (plcReadTest.isPending) {
      return (
        <Card>
          <CardHeader title="PLC" />
          <CardContent>
            <Skeleton />
            <Skeleton animation="wave" />
            <Skeleton animation={false} />
          </CardContent>
        </Card>
      );
    }

    if (plcReadTest.isError) {
      return (
        <ErrorAlert
          error={plcReadTest.error}
          onRetry={() => {
            plcReadTest.refetch();
          }}
          isRetrying={plcReadTest.isRefetching}
        />
      );
    }

    return (
      <Card>
        <CardHeader
          title="PLC"
          action={
            <IconButton
              onClick={() => {
                plcReadTest.refetch();
              }}
              disabled={plcReadTest.isRefetching}
            >
              <Refresh />
            </IconButton>
          }
        />
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
                  value={plcReadTest.data.D20}
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
                  value={plcReadTest.data.D21}
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
                  value={plcReadTest.data.D22}
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
                  value={plcReadTest.data.D23}
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
                        placeholder={plcReadTest.data.D300 + ""}
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
                        placeholder={plcReadTest.data.D301 + ""}
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
                        placeholder={plcReadTest.data.D302 + ""}
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
                        placeholder={plcReadTest.data.D303 + ""}
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
                        placeholder={plcReadTest.data.D308 + ""}
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
                        placeholder={plcReadTest.data.D309 + ""}
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
          <Button
            type="submit"
            form={formId}
            disabled={plcWriteTest.isPending}
            startIcon={
              plcWriteTest.isPending ? <CircularProgress size={20} /> : <Save />
            }
          >
            保存
          </Button>
          <Button type="reset" form={formId} startIcon={<Restore />}>
            重置
          </Button>
        </CardActions>
      </Card>
    );
  };

  const renderSerialPortQuery = () => {
    if (serialPorts.isPending) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 6,
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (serialPorts.isError) {
      return (
        <ErrorAlert
          error={serialPorts.error}
          onRetry={() => {
            serialPorts.refetch();
          }}
          isRetrying={serialPorts.isRefetching}
        />
      );
    }

    if (serialPorts.data.length === 0) {
      return (
        <Alert severity="info" variant="outlined">
          <AlertTitle>提示</AlertTitle>
          <Typography>当前设备无串口可用</Typography>
          <Button
            onClick={() => {
              serialPorts.refetch();
            }}
            disabled={serialPorts.isRefetching}
            startIcon={<Replay />}
            variant="contained"
          >
            重试
          </Button>
        </Alert>
      );
    }

    return (
      <>
        <Card>
          <CardHeader
            title="串口"
            subheader="指定串口"
            action={
              <IconButton
                onClick={() => {
                  serialPorts.refetch();
                }}
                disabled={serialPorts.isRefetching}
              >
                <Refresh />
              </IconButton>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
                <TextField
                  value={serialPortPath}
                  onChange={(e) => {
                    setSerialPort(e.target.value);
                  }}
                  label="串口"
                  fullWidth
                  select
                >
                  {serialPorts.data.map((el) => (
                    <MenuItem value={el.path} key={el.path}>
                      {el.path}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        {renderPLCReadQuery()}
      </>
    );
  };

  return <Stack spacing={3}>{renderSerialPortQuery()}</Stack>;
};
