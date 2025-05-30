import { Controller, useFieldArray, useForm } from "react-hook-form";
import {} from "@hookform/resolvers";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import { NumberField } from "@/components/number";
import { PlusOneOutlined } from "@mui/icons-material";
import { devLog } from "#/lib/utils";

const schema = z.object({
  list: z
    .object({
      index: z.string().min(1),
      size: z
        .number()
        .gt(0)
        .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
          message: "最多只能有两位小数",
        }),
      xlsxName: z.string().min(1),
      type: z.string().min(1),
    })
    .array()
    .superRefine((arr, ctx) => {
      const keyMap = new Map<string, number[]>();
      arr.forEach((item, idx) => {
        if (!keyMap.has(item.index)) {
          keyMap.set(item.index, []);
        }
        keyMap.get(item.index)!.push(idx);
      });
      keyMap.forEach((indices, key) => {
        if (key && indices.length > 1) {
          // 只给后面重复的 key 报错
          indices.slice(1).forEach((idx) => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "key 不能重复",
              path: [idx, "key"],
            });
          });
        }
      });
    }),
});

type FormValues = z.infer<typeof schema>;

const useXlsxForm = (defaultValues: FormValues) => {
  return useForm({
    defaultValues,
    resolver: zodResolver(schema),
  });
};

export const Component = () => {
  const formId = React.useId();

  const form = useXlsxForm({ list: [] });
  const fields = useFieldArray({ control: form.control, name: "list" });

  const handleSubmit = form.handleSubmit((data) => {
    devLog(data);
  }, console.warn);

  return (
    <Card>
      <CardHeader
        action={
          <IconButton
            onClick={() => {
              fields.append({
                index: "",
                size: 0,
                type: "",
                xlsxName: "",
              });
            }}
          >
            <PlusOneOutlined />
          </IconButton>
        }
      />
      <CardContent>
        <form id={formId} onSubmit={handleSubmit} onReset={() => form.reset()}>
          <Grid container spacing={1.5}>
            {fields.fields.map((i, idx) => (
              <React.Fragment key={i.id}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h5" color="primary">
                    #{idx + 1}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Controller
                    control={form.control}
                    name={`list.${idx}.index`}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        fullWidth
                        label="行列号"
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Controller
                    control={form.control}
                    name={`list.${idx}.size`}
                    render={({ field, fieldState }) => (
                      <NumberField
                        field={field}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        fullWidth
                        label="长度"
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Controller
                    control={form.control}
                    name={`list.${idx}.type`}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        fullWidth
                        label="行/列"
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Controller
                    control={form.control}
                    name={`list.${idx}.xlsxName`}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        fullWidth
                        label="xlsx文件"
                      />
                    )}
                  />
                </Grid>
                <Grid size={12}>
                  <Divider />
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </form>
      </CardContent>
      <CardActions>
        <Button type="submit" form={formId}>
          Submit
        </Button>
        <Button type="reset" form={formId}>
          Reset
        </Button>
      </CardActions>
    </Card>
  );
};
