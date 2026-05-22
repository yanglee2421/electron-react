import {
  fetchDRead,
  fetchMRead,
  fetchPLCReadTest,
  fetchSerialPortList,
  fetchXRead,
  fetchYRead,
  useDWrite,
  useMWrite,
  usePLCWriteTest,
  useYWrite,
} from "#renderer/api/plc";
import { NumberField } from "#renderer/components/number";
import { usePLCStore } from "#renderer/hooks/stores/usePLCStore";
import {
  Grid3x3,
  KeyboardReturn,
  Refresh,
  Replay,
  Restore,
  Save,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@toolpad/core";

import React from "react";
import { z } from "zod";

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

interface XInputProps {
  path: string;
  address: number;
}

const XInput = (props: XInputProps) => {
  const query = useQuery(
    fetchXRead({
      path: props.path,
      address: props.address,
    }),
  );

  if (!query.isSuccess) {
    return null;
  }

  return (
    <FormControlLabel
      control={<Checkbox value={query.data} />}
      label={"X" + props.address}
    />
  );
};

interface YInputProps {
  path: string;
  address: number;
}

const YInput = (props: YInputProps) => {
  const queryOptions = fetchYRead({
    path: props.path,
    address: props.address,
  });
  const query = useQuery(queryOptions);

  const writeY = useYWrite();
  const queryClient = useQueryClient();

  if (!query.isSuccess) {
    return null;
  }

  return (
    <FormControlLabel
      control={
        <Switch
          checked={query.data}
          onChange={(_, checked) => {
            queryClient.setQueryData(queryOptions.queryKey, checked);
            writeY.mutate({
              path: props.path,
              address: props.address,
              value: checked,
            });
          }}
        />
      }
      label={"Y" + props.address}
    />
  );
};

interface MInputProps {
  path: string;
  address: number;
}

const MInput = (props: MInputProps) => {
  const query = useQuery(
    fetchMRead({
      path: props.path,
      address: props.address,
    }),
  );

  const writeM = useMWrite();
  const queryClient = useQueryClient();

  if (!query.isSuccess) {
    return null;
  }

  return (
    <FormControlLabel
      control={<Switch value={query.data} onChange={() => {}} />}
      label={"M" + props.address}
    />
  );
};

interface DInputProps {
  path: string;
  address: number;
}

const DInput = (props: DInputProps) => {
  const [value, setValue] = React.useState(Number.NaN);

  const query = useQuery(
    fetchDRead({
      path: props.path,
      address: props.address,
    }),
  );

  const inputValue = value || query.data || NaN;

  const writeD = useDWrite();
  const queryClient = useQueryClient();

  if (!query.isSuccess) {
    return null;
  }

  return (
    <NumberField
      field={{
        value: inputValue,
        onChange: setValue,
        onBlur: () => {},
      }}
      placeholder={query.data.toString(10)}
      fullWidth
      label={"D" + props.address}
    />
  );
};

interface AddButtonProps {
  onAdd(_: number): void;
}

const AddButton = (props: AddButtonProps) => {
  const [address, setAddress] = React.useState(Number.NaN);

  return (
    <NumberField
      field={{
        value: address,
        onChange: setAddress,
        onBlur: () => {},
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="end">
              <Grid3x3 />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => {
                  props.onAdd(address);
                  setAddress(0);
                }}
              >
                <KeyboardReturn />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      fullWidth
    />
  );
};

export const Component = () => {
  const [serialPort, setSerialPort] = React.useState("");

  const formId = React.useId();

  const serialPorts = useQuery(fetchSerialPortList());

  const serialPortPath = serialPort || serialPorts.data?.at(0)?.path || "";

  const plcReadTest = useQuery({
    ...fetchPLCReadTest(serialPortPath),
    // refetchInterval: (query) => {
    //   if (query.state.fetchFailureCount > 1) {
    //     return false;
    //   }

    //   return 1000;
    // },
    enabled: !!serialPortPath,
  });
  const plcWriteTest = usePLCWriteTest();
  const notifications = useNotifications();
  const xList = usePLCStore((s) => s.x);
  const yList = usePLCStore((s) => s.y);
  const mList = usePLCStore((s) => s.m);
  const dList = usePLCStore((s) => s.d);

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

  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader title="配置" />
        <Divider></Divider>
        <CardContent>
          <Grid container spacing={1}>
            <Grid size={12}>
              <FormLabel>X点</FormLabel>
            </Grid>
            {xList.map((i) => {
              return (
                <Grid key={i.address}>
                  <XInput path={serialPortPath} address={i.address} />
                </Grid>
              );
            })}
            <Grid size={12}>
              <AddButton
                onAdd={(address) => {
                  usePLCStore.setState((draft) => {
                    draft.x.push({ address });
                  });
                }}
              />
            </Grid>
            <Grid size={12}>
              <FormLabel>Y点</FormLabel>
            </Grid>
            {yList.map((i) => {
              return (
                <Grid key={i.address}>
                  <YInput path={serialPortPath} address={i.address} />
                </Grid>
              );
            })}
            <Grid size={12}>
              <AddButton
                onAdd={(address) => {
                  usePLCStore.setState((draft) => {
                    draft.y.push({ address });
                  });
                }}
              />
            </Grid>
            <Grid size={12}>
              <FormLabel>M点</FormLabel>
            </Grid>
            {mList.map((i) => {
              return (
                <Grid key={i.address}>
                  <MInput path={serialPortPath} address={i.address} />
                </Grid>
              );
            })}
            <Grid size={12}>
              <AddButton
                onAdd={(address) => {
                  usePLCStore.setState((draft) => {
                    draft.m.push({ address });
                  });
                }}
              />
            </Grid>
            <Grid size={12}>
              <FormLabel>D点</FormLabel>
            </Grid>
            {dList.map((i) => {
              return (
                <Grid key={i.address} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <DInput path={serialPortPath} address={i.address} />
                </Grid>
              );
            })}
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <AddButton
                onAdd={(address) => {
                  usePLCStore.setState((draft) => {
                    draft.d.push({ address });
                  });
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {renderSerialPortQuery()}
    </Stack>
  );
};
// X boolean readonly
// Y boolean switch
// M boolean switch
// D number input
