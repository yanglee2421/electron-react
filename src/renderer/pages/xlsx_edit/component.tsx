import { useForm } from "@tanstack/react-form";
import React from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  TextField,
} from "@mui/material";
import { z } from "zod";
import { NumberField } from "#renderer/components/number";
import {
  SaveOutlined,
  RestoreOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "#renderer/components/Loading";
import {
  fetchSqliteXlsxSize,
  useXlsxSizeUpdate,
} from "#renderer/api/fetch_preload";

const rowIndexFieldSchema = z
  .string()
  .min(1)
  .refine((value) => /^\d+$/.test(value), {
    message: "行的索引必须全为全为数字",
  });
const columnIndexFieldSchema = z
  .string()
  .min(1)
  .refine((value) => /^[A-Z]+$/.test(value), {
    message: "列的索引必须全为大写字母",
  });
const xlsxNameSchema = z.string().min(1);
const rowTypeSchema = z.literal("row");
const columnTypeFieldSchema = z.literal("column");
const rowHeightFieldSchema = z
  .number()
  .gt(0)
  .max(409)
  .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
    message: "最多只能有两位小数",
  });

const columnWidthFieldSchema = z
  .number()
  .gt(0)
  .max(255)
  .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
    message: "最多只能有两位小数",
  });

const listItemFieldSchema = z
  .object({
    index: rowIndexFieldSchema,
    size: rowHeightFieldSchema,
    type: rowTypeSchema,
    xlsxName: xlsxNameSchema,
  })
  .or(
    z.object({
      index: columnIndexFieldSchema,
      size: columnWidthFieldSchema,
      type: columnTypeFieldSchema,
      xlsxName: xlsxNameSchema,
    }),
  );

export const Component = () => {
  const formId = React.useId();

  const update = useXlsxSizeUpdate();
  const navigate = useNavigate();
  const params = useParams();
  const currentId = Number(params.id);
  const query = useQuery({
    ...fetchSqliteXlsxSize({ id: currentId }),
  });

  const form = useForm({
    defaultValues: {
      xlsxName: query.data?.rows.at(0)?.xlsxName || "",
      type: query.data?.rows.at(0)?.type || "row",
      index: query.data?.rows.at(0)?.index || "",
      size: query.data?.rows.at(0)?.size || 14,
    },
    async onSubmit({ value }) {
      await update.mutateAsync({ ...value, id: currentId });
      await navigate("/xlsx");
    },
    validators: {
      onChange: listItemFieldSchema,
    },
  });

  const renderForm = () => {
    if (query.isPending) {
      return (
        <CardContent>
          <Loading />
        </CardContent>
      );
    }

    if (query.isError) {
      return (
        <>
          <CardContent></CardContent>
          <CardActions>
            <Button
              onClick={() => {
                query.refetch();
              }}
              disabled={query.isRefetching}
            >
              重试
            </Button>
          </CardActions>
        </>
      );
    }

    return (
      <>
        <CardContent>
          <form
            id={formId}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            onReset={() => form.reset()}
            noValidate
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <form.Field name="xlsxName">
                  {(xlsxNameField) => (
                    <TextField
                      value={xlsxNameField.state.value}
                      onChange={(e) => {
                        xlsxNameField.handleChange(e.target.value);
                      }}
                      onBlur={xlsxNameField.handleBlur}
                      error={!!xlsxNameField.state.meta.errors.length}
                      helperText={xlsxNameField.state.meta.errors[0]?.message}
                      fullWidth
                      label="xlsx文件"
                      select
                    >
                      <MenuItem value="chr501">chr501</MenuItem>
                      <MenuItem value="chr502">chr502</MenuItem>
                      <MenuItem value="chr53a">chr53a</MenuItem>
                    </TextField>
                  )}
                </form.Field>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <form.Field name="type">
                  {(typeField) => (
                    <TextField
                      value={typeField.state.value}
                      onChange={(e) => {
                        typeField.handleChange(e.target.value);
                      }}
                      onBlur={typeField.handleBlur}
                      error={!!typeField.state.meta.errors.length}
                      helperText={typeField.state.meta.errors.at(0)?.message}
                      fullWidth
                      label="行/列"
                      select
                    >
                      <MenuItem value="row">行</MenuItem>
                      <MenuItem value="column">列</MenuItem>
                    </TextField>
                  )}
                </form.Field>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <form.Field name="index">
                  {(indexField) => (
                    <TextField
                      value={indexField.state.value}
                      onChange={(e) => {
                        indexField.handleChange(e.target.value);
                      }}
                      onBlur={indexField.handleBlur}
                      error={!!indexField.state.meta.errors.length}
                      helperText={indexField.state.meta.errors.at(0)?.message}
                      fullWidth
                      label="索引"
                    />
                  )}
                </form.Field>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <form.Field name="size">
                  {(sizeField) => (
                    <NumberField
                      field={{
                        value: sizeField.state.value,
                        onChange(value) {
                          sizeField.handleChange(value);
                        },
                        onBlur: sizeField.handleBlur,
                      }}
                      error={!!sizeField.state.meta.errors.length}
                      helperText={sizeField.state.meta.errors[0]?.message}
                      fullWidth
                      label="长度"
                    />
                  )}
                </form.Field>
              </Grid>
            </Grid>
          </form>
        </CardContent>
        <CardActions>
          <form.Subscribe>
            {(props) => (
              <Button
                type="submit"
                form={formId}
                startIcon={
                  props.isSubmitting ? (
                    <CircularProgress color="inherit" size={16} />
                  ) : (
                    <SaveOutlined />
                  )
                }
                disabled={!props.canSubmit}
              >
                保存
              </Button>
            )}
          </form.Subscribe>
          <Button type="reset" form={formId} startIcon={<RestoreOutlined />}>
            重置
          </Button>
        </CardActions>
      </>
    );
  };

  return (
    <Card>
      <CardHeader
        title="编辑"
        action={
          <IconButton
            color="error"
            onClick={() => {
              navigate(-1);
            }}
          >
            <CloseOutlined />
          </IconButton>
        }
      />
      {renderForm()}
    </Card>
  );
};
