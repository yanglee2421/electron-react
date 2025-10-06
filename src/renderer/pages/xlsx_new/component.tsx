import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormHelperText,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import { NumberField } from "@/components/number";
import {
  DeleteOutlined,
  PlusOneOutlined,
  RestoreOutlined,
  SaveOutlined,
} from "@mui/icons-material";
import { useXlsxSizeCreate } from "@/api/fetch_preload";
import { useNavigate } from "react-router";
import { useNotifications } from "@toolpad/core";

const xlsxNameSchema = z.string().min(1);
const rowTypeSchema = z.literal("row");
const columnTypeFieldSchema = z.literal("column");

const validateFieldValue = (
  schema: z.ZodString | z.ZodNumber,
  value: string | number,
  path: string,
  ctx: z.RefinementCtx,
) => {
  const result = schema.safeParse(value);

  if (result.success) {
    return;
  }

  result.error.issues.forEach((issue) => {
    ctx.addIssue({
      ...issue,
      path: [path],
    });
  });
};

const listItemFieldSchema = z
  .object({
    index: z.string(),
    size: z.number(),
    type: rowTypeSchema.or(columnTypeFieldSchema),
    xlsxName: xlsxNameSchema,
  })
  .superRefine((value, ctx) => {
    if (value.type === "row") {
      const rowIndexFieldSchema = z
        .string()
        .min(1)
        .refine((value) => /^\d+$/.test(value), "行的索引必须全为全为数字");

      const rowHeightFieldSchema = z
        .number()
        .gt(0)
        .max(409)
        .refine(
          (val) => /^\d+(\.\d{1,2})?$/.test(val.toString()),
          "最多只能有两位小数",
        );

      validateFieldValue(rowIndexFieldSchema, value.index, "index", ctx);
      validateFieldValue(rowHeightFieldSchema, value.size, "size", ctx);
      return;
    }

    if (value.type === "column") {
      const columnIndexFieldSchema = z
        .string()
        .min(1)
        .refine((value) => /^[A-Z]+$/.test(value), "列的索引必须全为大写字母");

      const columnWidthFieldSchema = z
        .number()
        .gt(0)
        .max(255)
        .refine(
          (val) => /^\d+(\.\d{1,2})?$/.test(val.toString()),
          "最多只能有两位小数",
        );

      validateFieldValue(columnIndexFieldSchema, value.index, "index", ctx);
      validateFieldValue(columnWidthFieldSchema, value.size, "size", ctx);
      return;
    }

    ctx.addIssue({
      code: "invalid_value",
      values: ["row", "column"],
      message: "类型错误",
      path: ["type"],
    });
  });

const listFieldSchema = listItemFieldSchema
  .array()
  .nonempty()
  .superRefine((value, ctx) => {
    const errorSet = new Map<string, number>();
    value.forEach((item, index) => {
      const setKey = `${item.xlsxName}:${item.type}:${item.index}`;
      if (errorSet.has(setKey)) {
        const prevIndex = errorSet.get(setKey);
        ctx.addIssue({
          code: "custom",
          message: `与#${index}重复`,
          path: [prevIndex || 0, "index"],
        });
        ctx.addIssue({
          code: "custom",
          message: `与#${prevIndex}重复`,
          path: [index, "index"],
        });
      } else {
        errorSet.set(setKey, index);
      }
    });
  });

const schema = z.object({ list: listFieldSchema });

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  list: [
    {
      xlsxName: "chr501",
      type: "row",
      index: "1",
      size: 15,
    },
  ],
};

export const Component = () => {
  const formId = React.useId();

  const toast = useNotifications();
  const create = useXlsxSizeCreate();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues,
    async onSubmit({ value }) {
      await create.mutateAsync(value.list, {
        onError(error) {
          toast.show(error.message, { severity: "error" });
        },
      });
      await navigate("/xlsx");
    },
    validators: {
      onChange: schema,
    },
  });

  return (
    <Card>
      <CardHeader
        action={
          <IconButton
            onClick={() => {
              form.insertFieldValue("list", form.state.values.list.length, {
                xlsxName: "chr501",
                type: "row",
                index: "",
                size: 15,
              });
            }}
          >
            <PlusOneOutlined />
          </IconButton>
        }
        title="新增"
        subheader="新增行列尺寸"
      />
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
          <Grid container spacing={1.5}>
            <form.Field name="list" mode="array">
              {(listField) => (
                <>
                  {listField.state.value.map((_, listIndex, array) => (
                    <React.Fragment key={listIndex}>
                      <Grid size={{ xs: 12 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="h5" color="primary">
                            #{listIndex + 1}
                          </Typography>
                          <IconButton
                            onClick={() => {
                              listField.removeValue(listIndex);
                            }}
                            color="error"
                          >
                            <DeleteOutlined />
                          </IconButton>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <form.Field name={`list[${listIndex}].xlsxName`}>
                          {(xlsxNameField) => (
                            <TextField
                              value={xlsxNameField.state.value}
                              onChange={(e) => {
                                xlsxNameField.handleChange(e.target.value);
                              }}
                              onBlur={xlsxNameField.handleBlur}
                              error={!!xlsxNameField.state.meta.errors.length}
                              helperText={
                                xlsxNameField.state.meta.errors[0]?.message
                              }
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
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <form.Field name={`list[${listIndex}].type`}>
                          {(typeField) => (
                            <TextField
                              value={typeField.state.value}
                              onChange={(e) => {
                                const value = e.target.value;
                                switch (value) {
                                  case "row":
                                  case "column":
                                    typeField.handleChange(value);
                                }
                              }}
                              onBlur={typeField.handleBlur}
                              error={!!typeField.state.meta.errors.length}
                              helperText={
                                typeField.state.meta.errors[0]?.message
                              }
                              fullWidth
                              select
                              label="行/列"
                            >
                              <MenuItem value="row">行</MenuItem>
                              <MenuItem value="column">列</MenuItem>
                            </TextField>
                          )}
                        </form.Field>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <form.Field name={`list[${listIndex}].index`}>
                          {(indexField) => (
                            <TextField
                              value={indexField.state.value}
                              onChange={(e) => {
                                const value = e.target.value;
                                indexField.handleChange(value);
                              }}
                              error={!!indexField.state.meta.errors.length}
                              helperText={
                                indexField.state.meta.errors[0]?.message
                              }
                              fullWidth
                              label="索引"
                            />
                          )}
                        </form.Field>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <form.Field name={`list[${listIndex}].size`}>
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
                              helperText={
                                sizeField.state.meta.errors[0]?.message
                              }
                              fullWidth
                              label="长度"
                            />
                          )}
                        </form.Field>
                      </Grid>

                      {!Object.is(listIndex + 1, array.length) && (
                        <Grid size={12}>
                          <Divider />
                        </Grid>
                      )}
                    </React.Fragment>
                  ))}
                  {!!listField.state.meta.errors.length && (
                    <FormHelperText error>
                      {listField.state.meta.errors[0]?.message}
                    </FormHelperText>
                  )}
                </>
              )}
            </form.Field>
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
    </Card>
  );
};
