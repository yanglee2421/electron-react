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
import { Loading, PendingIcon } from "#renderer/components/Loading";
import { NumberField } from "#renderer/components/number";
import { ScrollToTopButton } from "#renderer/components/scroll";
import { usePLCStore } from "#renderer/hooks/stores/usePLCStore";
import { ipc } from "#renderer/lib/ipc";
import {
  Add,
  Delete,
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
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  createFormHook,
  createFormHookContexts,
  useForm,
} from "@tanstack/react-form";
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
    NumberField: NumberField,
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

interface ErrorAlertProps {
  error: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
}

const ErrorAlert = (props: ErrorAlertProps) => {
  const { error } = props;

  return (
    <Alert severity="error" variant="outlined">
      <AlertTitle>错误</AlertTitle>
      {error instanceof Error ? (
        <>
          <Typography>{error.message}</Typography>
          <Typography variant="body2">{error.stack}</Typography>
        </>
      ) : (
        <Typography>未知错误，请联系服务人员</Typography>
      )}
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
  description?: React.ReactNode;
}

const XInput = (props: XInputProps) => {
  const queryInput = fetchXRead({
    path: props.path,
    address: props.address,
  });
  const query = useQuery({
    ...queryInput,
    enabled: !!props.path,
    refetchInterval: 1000 * 3,
  });

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Typography color="error" variant="body2">
          {query.error.message}
        </Typography>
      );
    }

    return (
      <FormControlLabel
        control={<Checkbox checked={query.data} readOnly onChange={Boolean} />}
        label={"X" + props.address}
      />
    );
  };

  return (
    <BitInputWrapper
      address={props.address}
      type="X"
      subheader={props.description}
      action={
        <IconButton
          disabled={query.isRefetching}
          onClick={() => {
            query.refetch();
          }}
        >
          <PendingIcon isPending={query.isRefetching}>
            <Refresh />
          </PendingIcon>
        </IconButton>
      }
    >
      {renderQuery()}
    </BitInputWrapper>
  );
};

interface YInputProps {
  path: string;
  address: number;
  description?: React.ReactNode;
}

const YInput = (props: YInputProps) => {
  const queryInput = fetchYRead({
    path: props.path,
    address: props.address,
  });
  const writeY = useYWrite();
  const query = useQuery({ ...queryInput, enabled: !!props.path });
  const queryClient = useQueryClient();

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Typography color="error" variant="body2">
          {query.error.message}
        </Typography>
      );
    }

    return (
      <FormControlLabel
        control={
          <Switch
            checked={query.data}
            onChange={(_, checked) => {
              queryClient.setQueryData(queryInput.queryKey, checked);
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

  return (
    <BitInputWrapper
      address={props.address}
      type="Y"
      subheader={props.description}
      action={
        <IconButton
          disabled={query.isRefetching}
          onClick={() => {
            query.refetch();
          }}
        >
          <PendingIcon isPending={query.isRefetching}>
            <Refresh />
          </PendingIcon>
        </IconButton>
      }
    >
      {renderQuery()}
    </BitInputWrapper>
  );
};

interface MInputProps {
  path: string;
  address: number;
  description?: React.ReactNode;
}

const MInput = (props: MInputProps) => {
  const queryInput = fetchMRead({
    path: props.path,
    address: props.address,
  });
  const writeM = useMWrite();
  const query = useQuery({ ...queryInput, enabled: !!props.path });
  const queryClient = useQueryClient();

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Typography color="error" variant="body2">
          {query.error.message}
        </Typography>
      );
    }

    return (
      <FormControlLabel
        control={
          <Switch
            checked={query.data}
            onChange={(_, checked) => {
              queryClient.setQueryData(queryInput.queryKey, checked);
              writeM.mutate({
                path: props.path,
                address: props.address,
                value: checked,
              });
            }}
          />
        }
        label={"M" + props.address}
      />
    );
  };

  return (
    <BitInputWrapper
      type="M"
      address={props.address}
      subheader={props.description}
      action={
        <IconButton
          disabled={query.isRefetching}
          onClick={() => {
            query.refetch();
          }}
        >
          <PendingIcon isPending={query.isRefetching}>
            <Refresh />
          </PendingIcon>
        </IconButton>
      }
    >
      {renderQuery()}
    </BitInputWrapper>
  );
};

interface DInputProps {
  path: string;
  address: number;
  description?: React.ReactNode;
}

const DInput = (props: DInputProps) => {
  const formId = React.useId();

  const queryInput = fetchDRead({
    path: props.path,
    address: props.address,
  });

  const writeD = useDWrite();
  const notifications = useNotifications();
  const query = useQuery({ ...queryInput, enabled: !!props.path });

  const defaultValue = typeof query.data === "number" ? query.data : 0;

  const form = useForm({
    defaultValues: {
      value: defaultValue,
    },
    onSubmit: async (c) => {
      writeD.mutate(
        {
          address: props.address,
          path: props.path,
          value: c.value.value,
        },
        {
          onError: async (error) => {
            notifications.show(error.message, { severity: "error" });
          },
          onSuccess: async () => {
            notifications.show(`更改D${props.address}成功`, {
              severity: "success",
            });
          },
        },
      );
    },
    validators: { onChange: z.object({ value: z.number().int() }) },
  });

  const renderQuery = () => {
    if (query.isPending) {
      return <Loading />;
    }

    if (query.isError) {
      return (
        <Typography color="error" variant="body2">
          {query.error.message}
        </Typography>
      );
    }

    return (
      <form
        id={formId}
        onSubmit={(e) => {
          e.stopPropagation();
          e.preventDefault();
          form.handleSubmit();
        }}
        onReset={() => form.reset()}
        noValidate
      >
        <form.Field name="value">
          {(field) => {
            return (
              <NumberField
                field={{
                  value: field.state.value,
                  onChange: field.handleChange,
                  onBlur: field.handleBlur,
                }}
                placeholder={query.data.toString(10)}
                fullWidth
                error={!!field.getMeta().errors.length}
                helperText={field.getMeta().errors.at(0)?.message}
                label={"D" + props.address}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <form.Subscribe
                          selector={(s) => [s.canSubmit, s.isSubmitting]}
                        >
                          {([canSubmit, isSubmitting]) => {
                            return (
                              <Button
                                type="submit"
                                form={formId}
                                disabled={!canSubmit}
                                endIcon={
                                  <PendingIcon isPending={isSubmitting}>
                                    <KeyboardReturn />
                                  </PendingIcon>
                                }
                                variant="contained"
                                size="small"
                              >
                                写入
                              </Button>
                            );
                          }}
                        </form.Subscribe>
                      </InputAdornment>
                    ),
                  },
                }}
                _enableReturnSubmit
              />
            );
          }}
        </form.Field>
      </form>
    );
  };

  return (
    <BitInputWrapper
      type="D"
      address={props.address}
      subheader={props.description}
      action={
        <IconButton
          disabled={query.isRefetching}
          onClick={() => {
            query.refetch();
          }}
        >
          <PendingIcon isPending={query.isRefetching}>
            <Refresh />
          </PendingIcon>
        </IconButton>
      }
    >
      {renderQuery()}
    </BitInputWrapper>
  );
};

const Form = () => {
  const notifications = useNotifications();

  const form = useForm({
    defaultValues: {
      type: "X",
      address: 0,
      description: "",
    },
    onSubmit: (c) => {
      const type = c.value.type;
      const address = c.value.address;
      const description = c.value.description;

      usePLCStore.setState((draft) => {
        switch (type) {
          case "X":
            if (draft.x.some((item) => item.address === address)) {
              notifications.show(`${type + address} 已存在`, {
                severity: "warning",
              });
            } else {
              draft.x.push({ address, description });
            }
            break;
          case "Y":
            if (draft.y.some((item) => item.address === address)) {
              notifications.show(`${type + address} 已存在`, {
                severity: "warning",
              });
            } else {
              draft.y.push({ address, description });
            }
            break;
          case "D":
            if (draft.d.some((item) => item.address === address)) {
              notifications.show(`${type + address} 已存在`, {
                severity: "warning",
              });
            } else {
              draft.d.push({ address, description });
            }
            break;
          case "M":
            if (draft.m.some((item) => item.address === address)) {
              notifications.show(`${type + address} 已存在`, {
                severity: "warning",
              });
            } else {
              draft.m.push({ address, description });
            }
            break;
        }
      });
    },
    validators: {
      onChange: z.object({
        type: z.string(),
        address: z.number().int(),
        description: z.string(),
      }),
    },
  });

  const formId = React.useId();

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      noValidate
      onReset={() => {
        form.reset();
      }}
    >
      <Grid container spacing={2}>
        <Grid size={12}>
          <form.Field name="type">
            {(field) => {
              return (
                <RadioGroup
                  value={field.state.value}
                  onChange={(_, value) => {
                    field.handleChange(value);
                  }}
                  row
                >
                  <FormControlLabel control={<Radio value={"X"} />} label="X" />
                  <FormControlLabel control={<Radio value={"Y"} />} label="Y" />
                  <FormControlLabel control={<Radio value={"M"} />} label="M" />
                  <FormControlLabel control={<Radio value={"D"} />} label="D" />
                </RadioGroup>
              );
            }}
          </form.Field>
        </Grid>
        <Grid size={12}>
          <form.Field name="address">
            {(field) => {
              return (
                <NumberField
                  field={{
                    value: field.state.value,
                    onChange: field.handleChange,
                    onBlur: field.handleBlur,
                  }}
                  name={field.name}
                  _min={0}
                  fullWidth
                  label="点位地址"
                />
              );
            }}
          </form.Field>
        </Grid>
        <Grid size={12}>
          <form.Field name="description">
            {(field) => {
              return (
                <TextField
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                  onBlur={field.handleBlur}
                  error={!!field.getMeta().errors.length}
                  helperText={field.getMeta().errors.at(0)?.message}
                  name={field.name}
                  fullWidth
                  label="地址描述"
                />
              );
            }}
          </form.Field>
        </Grid>
        <Grid size={12}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => {
                return (
                  <Button
                    disabled={!canSubmit}
                    form={formId}
                    type="submit"
                    variant="contained"
                    startIcon={
                      <PendingIcon isPending={isSubmitting}>
                        <Add />
                      </PendingIcon>
                    }
                  >
                    新增点位
                  </Button>
                );
              }}
            </form.Subscribe>
            <Button variant="outlined" startIcon={<Restore />}>
              重置
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

interface BitInputWrapper {
  address: number;
  type: "X" | "Y" | "M" | "D";
  children?: React.ReactNode;
  subheader?: React.ReactNode;
  action?: React.ReactNode;
}

const BitInputWrapper = (props: BitInputWrapper) => {
  const handleDelete = () => {
    usePLCStore.setState((draft) => {
      switch (props.type) {
        case "Y":
          draft.y = draft.y.filter(
            (item) => !Object.is(item.address, props.address),
          );
          break;
        case "X":
          draft.x = draft.x.filter(
            (item) => !Object.is(item.address, props.address),
          );
          break;
        case "D":
          draft.d = draft.d.filter(
            (item) => !Object.is(item.address, props.address),
          );
          break;
        case "M":
          draft.m = draft.m.filter(
            (item) => !Object.is(item.address, props.address),
          );
      }
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={props.type + props.address}
        subheader={props.subheader}
        action={
          <>
            {props.action}
            <IconButton onClick={handleDelete}>
              <Delete />
            </IconButton>
          </>
        }
      />
      <CardContent>{props.children}</CardContent>
    </Card>
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

      return 1000 * 2;
    },
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

  React.useEffect(() => {
    ipc.invoke("plc/open", serialPortPath);

    return () => {
      ipc.invoke("plc/close");
    };
  }, [serialPortPath]);

  const renderPLCReadQuery = () => {
    if (plcReadTest.isPending) {
      return (
        <>
          <Card>
            <CardHeader
              title="预置点位"
              subheader="为气动多通道探伤机预置的一些点位"
            />
            <CardContent>
              <Skeleton />
              <Skeleton animation="wave" />
              <Skeleton animation={false} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader
              title="自定义点位"
              subheader="预置点位不能满足要求时，可以自定义点位"
            />
            <CardContent>
              <Skeleton />
              <Skeleton animation="wave" />
              <Skeleton animation={false} />
            </CardContent>
          </Card>
        </>
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
      <>
        <Card>
          <CardHeader
            title={"12通道预设"}
            subheader={"为12通道探伤机提供的预设点位"}
          />
          <CardContent>
            <Grid container spacing={1.5}>
              <Grid size={12}>
                <FormLabel>X点（控制）</FormLabel>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput address={26} path={serialPortPath} description="RD2" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput address={27} path={serialPortPath} description="RE2" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput address={14} path={serialPortPath} description="泵启" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput address={0} path={serialPortPath} description="总停" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput address={1} path={serialPortPath} description="自动" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput address={2} path={serialPortPath} description="手动" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput address={4} path={serialPortPath} description="推轮" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput address={3} path={serialPortPath} description="复位" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={5}
                  path={serialPortPath}
                  description="探头移动"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={7}
                  path={serialPortPath}
                  description="轮对反转"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={6}
                  path={serialPortPath}
                  description="轮对正转"
                />
              </Grid>

              <Grid size={12}>
                <FormLabel>X到位信号</FormLabel>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={16}
                  path={serialPortPath}
                  description="左量轮径到位"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={17}
                  path={serialPortPath}
                  description="右量轮径到位"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={22}
                  path={serialPortPath}
                  description="左侧中心到位"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={21}
                  path={serialPortPath}
                  description="右侧中心到位"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={30}
                  path={serialPortPath}
                  description="RE2左端进到位"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={31}
                  path={serialPortPath}
                  description="RE2右端进到位"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={23}
                  path={serialPortPath}
                  description="左端面探头退到位"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={20}
                  path={serialPortPath}
                  description="右端面探头退到位"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={24}
                  path={serialPortPath}
                  description="轮对到位信号"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={15}
                  path={serialPortPath}
                  description="左轴身探头升到位"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <XInput
                  address={32}
                  path={serialPortPath}
                  description="右轴身探头升到位"
                />
              </Grid>

              <Grid size={12}>
                <FormLabel>Y点（执行）</FormLabel>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={2}
                  path={serialPortPath}
                  description="左量轮径降"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={6}
                  path={serialPortPath}
                  description="左量轮径升"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={3}
                  path={serialPortPath}
                  description="右量轮径降"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={7}
                  path={serialPortPath}
                  description="右量轮径升"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={16}
                  path={serialPortPath}
                  description="左端机构升"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={17}
                  path={serialPortPath}
                  description="右端机构升"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={24}
                  path={serialPortPath}
                  description="左右机构降"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={4}
                  path={serialPortPath}
                  description="左端面探头进"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={5}
                  path={serialPortPath}
                  description="右端面探头进"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={23}
                  path={serialPortPath}
                  description="左右端面探头退"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={14}
                  path={serialPortPath}
                  description="轴身左探头退"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={15}
                  path={serialPortPath}
                  description="轴身右探头退"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={27}
                  path={serialPortPath}
                  description="轴身左右探头进"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={20}
                  path={serialPortPath}
                  description="轮对正转"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={21}
                  path={serialPortPath}
                  description="轮对反转"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={31}
                  path={serialPortPath}
                  description="推轮/缓冲升"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={33}
                  path={serialPortPath}
                  description="缓冲缸降"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={32}
                  path={serialPortPath}
                  description="推杆复位"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput address={11} path={serialPortPath} description="RD2" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput address={10} path={serialPortPath} description="RE2" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={22}
                  path={serialPortPath}
                  description="探头移动"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput address={0} path={serialPortPath} description="油泵" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <YInput
                  address={1}
                  path={serialPortPath}
                  description="耦合泵"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            title="相控阵预设"
            subheader="为相控阵预设探伤机提供的预设点位"
            action={
              <IconButton
                onClick={() => {
                  plcReadTest.refetch();
                }}
                disabled={plcReadTest.isRefetching}
              >
                <PendingIcon isPending={plcReadTest.isRefetching}>
                  <Refresh />
                </PendingIcon>
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
              noValidate
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                  <TextField
                    value={plcReadTest.data.D20}
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                    label="D20"
                    helperText="左轴身实际值"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                  <TextField
                    value={plcReadTest.data.D21}
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                    label="D21"
                    helperText="右轴身实际值"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                  <TextField
                    value={plcReadTest.data.D22}
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                    label="D22"
                    helperText="左端面实际值"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                  <TextField
                    value={plcReadTest.data.D23}
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                    label="D23"
                    helperText="右端面实际值"
                  />
                </Grid>
                <Grid size={12}>
                  <Divider>分隔线</Divider>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                  <form.AppField name="D300">
                    {(field) => {
                      return (
                        <field.NumberField
                          fullWidth
                          label="D300"
                          placeholder={plcReadTest.data.D300 + ""}
                          field={{
                            value: field.state.value,
                            onChange: field.handleChange,
                            onBlur: field.handleBlur,
                          }}
                          _min={0}
                          error={field.state.meta.errors.length > 0}
                          helperText={
                            field.state.meta.errors.at(0)?.message ||
                            "左轴身降起始值"
                          }
                        />
                      );
                    }}
                  </form.AppField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                  <form.AppField name="D301">
                    {(field) => {
                      return (
                        <field.NumberField
                          fullWidth
                          label="D301"
                          placeholder={plcReadTest.data.D301 + ""}
                          field={{
                            value: field.state.value,
                            onChange: field.handleChange,
                            onBlur: field.handleBlur,
                          }}
                          _min={0}
                          error={field.state.meta.errors.length > 0}
                          helperText={
                            field.state.meta.errors.at(0)?.message ||
                            "右轴身降起始值"
                          }
                        />
                      );
                    }}
                  </form.AppField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                  <form.AppField name="D302">
                    {(field) => {
                      return (
                        <field.NumberField
                          fullWidth
                          label="D302"
                          placeholder={plcReadTest.data.D302 + ""}
                          field={{
                            value: field.state.value,
                            onChange: field.handleChange,
                            onBlur: field.handleBlur,
                          }}
                          _min={0}
                          error={field.state.meta.errors.length > 0}
                          helperText={
                            field.state.meta.errors.at(0)?.message ||
                            "左端面降起始值"
                          }
                        />
                      );
                    }}
                  </form.AppField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                  <form.AppField name="D303">
                    {(field) => {
                      return (
                        <field.NumberField
                          fullWidth
                          label="D303"
                          placeholder={plcReadTest.data.D303 + ""}
                          field={{
                            value: field.state.value,
                            onChange: field.handleChange,
                            onBlur: field.handleBlur,
                          }}
                          _min={0}
                          error={field.state.meta.errors.length > 0}
                          helperText={
                            field.state.meta.errors.at(0)?.message ||
                            "右端面降起始值"
                          }
                        />
                      );
                    }}
                  </form.AppField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                  <form.AppField name="D308">
                    {(field) => {
                      return (
                        <field.NumberField
                          fullWidth
                          label="D308"
                          placeholder={plcReadTest.data.D308 + ""}
                          field={{
                            value: field.state.value,
                            onChange: field.handleChange,
                            onBlur: field.handleBlur,
                          }}
                          _min={0}
                          error={field.state.meta.errors.length > 0}
                          helperText={
                            field.state.meta.errors.at(0)?.message ||
                            "左轴身差值"
                          }
                        />
                      );
                    }}
                  </form.AppField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                  <form.AppField name="D309">
                    {(field) => {
                      return (
                        <field.NumberField
                          fullWidth
                          label="D309"
                          placeholder={plcReadTest.data.D309 + ""}
                          field={{
                            value: field.state.value,
                            onChange: field.handleChange,
                            onBlur: field.handleBlur,
                          }}
                          _min={0}
                          error={field.state.meta.errors.length > 0}
                          helperText={
                            field.state.meta.errors.at(0)?.message ||
                            "右轴身差值"
                          }
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
                <PendingIcon isPending={plcWriteTest.isPending}>
                  <Save />
                </PendingIcon>
              }
            >
              保存
            </Button>
            <Button type="reset" form={formId} startIcon={<Restore />}>
              重置
            </Button>
          </CardActions>
        </Card>
        <Card>
          <CardHeader
            title="自定义点位"
            subheader="预设不能满足要求时，可以自定义点位"
          />
          <CardContent>
            <Form />
          </CardContent>
          <Divider></Divider>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={12}>
                <FormLabel>X点</FormLabel>
              </Grid>
              {xList.map((i) => {
                return (
                  <Grid key={i.address} size={{ xs: 12, sm: 6, md: 4 }}>
                    <XInput
                      path={serialPortPath}
                      address={i.address}
                      description={i.description}
                    />
                  </Grid>
                );
              })}
              <Grid size={12}>
                <FormLabel>Y点</FormLabel>
              </Grid>
              {yList.map((i) => {
                return (
                  <Grid key={i.address} size={{ xs: 12, sm: 6, md: 4 }}>
                    <YInput
                      path={serialPortPath}
                      address={i.address}
                      description={i.description}
                    />
                  </Grid>
                );
              })}
              <Grid size={12}>
                <FormLabel>M点</FormLabel>
              </Grid>
              {mList.map((i) => {
                return (
                  <Grid key={i.address} size={{ xs: 12, sm: 6, md: 4 }}>
                    <MInput
                      path={serialPortPath}
                      address={i.address}
                      description={i.description}
                    />
                  </Grid>
                );
              })}
              <Grid size={12}>
                <FormLabel>D点</FormLabel>
              </Grid>
              {dList.map((i) => {
                return (
                  <Grid key={i.address} size={{ xs: 12, sm: 6, md: 4 }}>
                    <DInput
                      path={serialPortPath}
                      address={i.address}
                      description={i.description}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </>
    );
  };

  const renderSerialPortQuery = () => {
    if (serialPorts.isPending) {
      return <Loading />;
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
            subheader="指定PLC所连接的串口, 一般为 COM1"
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
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
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
    <>
      <ScrollToTopButton />
      <Stack spacing={2}>{renderSerialPortQuery()}</Stack>
    </>
  );
};
