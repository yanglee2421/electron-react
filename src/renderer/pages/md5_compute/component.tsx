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
import { z } from "zod";
import React from "react";
import { useNotifications } from "@toolpad/core";
import { FindInPageOutlined } from "@mui/icons-material";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMD5Compute, useSelectFile } from "#renderer/api/fetch_preload";

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
  const [md5, setMD5] = React.useState("");

  const formId = React.useId();

  const md5BackupImage = useMD5Compute();
  const selectDirectory = useSelectFile();
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
        onSuccess: (data) => {
          setMD5(Object.keys(data).at(0) || "");
        },
      });
    },
  });

  const handleDirectoryChange = () => {
    selectDirectory.mutate(
      [
        {
          name: "Image",
          extensions: ["jpg", "jpeg", "png", "gif", "webp"],
        },
      ],
      {
        onError() {},
        onSuccess([data]) {
          if (!data) return;
          form.setFieldValue("directory", data);
          form.validateField("directory", "change");
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader title="MD5计算" subheader={md5} />
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
                    onDrop={(e) => {
                      e.preventDefault();
                      const [file] = [...e.dataTransfer.files];
                      const filePath =
                        window.electron.webUtils.getPathForFile(file);
                      form.setFieldValue("directory", filePath);
                      form.validateField("directory", "change");
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onPaste={(e) => {
                      const [file] = [...e.clipboardData.files];
                      const filePath =
                        window.electron.webUtils.getPathForFile(file);
                      form.setFieldValue("directory", filePath);
                      form.validateField("directory", "change");
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
