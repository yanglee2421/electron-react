import { Loading } from "@/components/Loading";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContentCopyOutlined, ContentPasteOutlined } from "@mui/icons-material";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  CardActions,
  Button,
} from "@mui/material";
import {
  useQueryClient,
  useMutation,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { useNotifications } from "@toolpad/core";
import { QRCodeSVG } from "qrcode.react";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Outlet } from "react-router";

const fetchActivation = () =>
  queryOptions({
    queryKey: ["fetchActivateCode"],
    queryFn: window.electronAPI.verifyActivation,
  });

const useActivation = () =>
  useQuery({
    ...fetchActivation(),

    retry: false,

    // Disable automatic refetching
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,

    // Disable garbage collection
    staleTime: Infinity,
    gcTime: Infinity,
  });

const activationSchema = z.object({
  activationCode: z.string().min(1, "激活码不能为空"),
});

const useActivationForm = () =>
  useForm({
    defaultValues: {
      activationCode: "",
    },
    resolver: zodResolver(activationSchema),
  });

const useActivate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activateCode: string) => {
      const data = await window.electronAPI.settings({
        activateCode,
      });
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchActivation().queryKey,
      });
    },
  });
};

export const ActivationForm = () => {
  const formId = React.useId();
  const [isPending, startTransition] = React.useTransition();

  const snackbar = useNotifications();
  const form = useActivationForm();
  const activate = useActivate();
  const activation = useActivation();

  if (activation.isPending) {
    return <Loading />;
  }

  if (activation.isError) {
    throw activation.error;
  }

  const code = activation.data.serial;

  return (
    <Card>
      <CardHeader title="未激活" subheader="请联系服务人员以激活应用" />
      <CardContent>
        <form
          id={formId}
          onSubmit={form.handleSubmit((data) => {
            activate.mutate(data.activationCode, {
              onError: (error) => {
                snackbar.show(error.message, {
                  severity: "error",
                });
              },
            });
          }, console.warn)}
        >
          <Grid container spacing={6}>
            <Grid size={12}>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box sx={{ bgcolor: "white", p: 3 }}>
                  <QRCodeSVG value={code} width={256} height={256} />
                </Box>
              </Box>
            </Grid>
            <Grid size={12}>
              <TextField
                label="识别码"
                fullWidth
                value={code}
                onChange={Boolean}
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          disabled={isPending}
                          onClick={() => {
                            startTransition(async () => {
                              await navigator.clipboard.writeText(code);
                              snackbar.show("复制成功", {
                                severity: "success",
                              });
                            });
                          }}
                        >
                          <ContentCopyOutlined />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                control={form.control}
                name="activationCode"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="激活码"
                    fullWidth
                    rows={1}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={async () => {
                                const text =
                                  await navigator.clipboard.readText();
                                field.onChange(text);
                              }}
                            >
                              <ContentPasteOutlined />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </form>
      </CardContent>
      <CardActions>
        <Button type="submit" form={formId} disabled={activate.isPending}>
          激活
        </Button>
      </CardActions>
    </Card>
  );
};

ActivationForm.useActivation = useActivation;
ActivationForm.fetchActivation = fetchActivation;

export const ActivationGuard = () => {
  const activation = ActivationForm.useActivation();

  if (activation.isPending) {
    return <Loading />;
  }

  if (activation.isError) {
    return <Box>{activation.error.message}</Box>;
  }

  if (!activation.data.isOk) {
    return <ActivationForm />;
  }

  return <Outlet />;
};
