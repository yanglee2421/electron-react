import {
  useMD5BackupImage,
  useSelectDirectory,
} from "#renderer/api/fetch_preload";
import { FindInPageOutlined } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useNotifications } from "@toolpad/core";
import React from "react";
import { z } from "zod";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
  },
  formComponents: {
    Button,
  },
});

const schema = z.object({
  directory: z.string().min(1),
});

export const Component = () => {
  const formId = React.useId();

  const md5BackupImage = useMD5BackupImage();
  const selectDirectory = useSelectDirectory();
  const notifications = useNotifications();
  const form = useAppForm({
    defaultValues: {
      directory: "",
    },
    validators: {
      onChange: schema,
    },
    async onSubmit({ value }) {
      await md5BackupImage.mutateAsync(value.directory, {
        onError: (error) => {
          notifications.show(error.message, { severity: "error" });
        },
        onSuccess: () => {
          notifications.show("备份成功", { severity: "success" });
        },
      });
    },
  });

  const handleDirectoryChange = () => {
    selectDirectory.mutate(void 0, {
      onError() {},
      onSuccess([data]) {
        if (!data) return;
        form.setFieldValue("directory", data);
        form.validateField("directory", "change");
      },
    });
  };

  return (
    <Card>
      <CardHeader title="图片去重备份" />
      <CardContent>
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          onReset={() => {
            form.reset();
          }}
          noValidate
        >
          <Grid container>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.AppField name="directory">
                {(directoryField) => (
                  <directoryField.TextField
                    value={directoryField.state.value}
                    onChange={(e) => {
                      directoryField.handleChange(e.target.value);
                    }}
                    fullWidth
                    helperText={
                      directoryField.getMeta().errors.length
                        ? directoryField.getMeta().errors.at(0)?.message
                        : "图片目录的所在路径"
                    }
                    error={directoryField.getMeta().errors.length > 0}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={handleDirectoryChange}
                              disabled={selectDirectory.isPending}
                            >
                              <PendingIcon
                                isPending={selectDirectory.isPending}
                              >
                                <FindInPageOutlined />
                              </PendingIcon>
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              </form.AppField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}></Grid>
          </Grid>
        </form>
      </CardContent>
      <CardActions>
        <form.Subscribe selector={(state) => state.canSubmit}>
          {(canSubmit) => (
            <Button form={formId} type="submit" disabled={!canSubmit}>
              确定
            </Button>
          )}
        </form.Subscribe>
      </CardActions>
    </Card>
  );
};

type PendingIconProps = React.PropsWithChildren<{
  isPending?: boolean;
  size?: number;
  color?: React.ComponentProps<typeof CircularProgress>["color"];
}>;

const PendingIcon = (props: PendingIconProps) => {
  const { size = 16, color } = props;

  if (props.isPending) {
    return <CircularProgress size={size} color={color} />;
  }

  return props.children;
};
