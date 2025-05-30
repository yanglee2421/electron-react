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
  IconButton,
  TextField,
} from "@mui/material";
import React from "react";
import { NumberField } from "@/components/number";
import { PlusOneOutlined } from "@mui/icons-material";
import { devLog } from "#/lib/utils";

const schema = z.object({
  list: z
    .object({
      key: z.string().min(1),
      value: z
        .number()
        .gt(0)
        .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
          message: "最多只能有两位小数",
        }),
    })
    .array()
    .superRefine((arr, ctx) => {
      const keyMap = new Map<string, number[]>();
      arr.forEach((item, idx) => {
        if (!keyMap.has(item.key)) {
          keyMap.set(item.key, []);
        }
        keyMap.get(item.key)!.push(idx);
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
                key: "",
                value: 0,
              });
            }}
          >
            <PlusOneOutlined />
          </IconButton>
        }
      />
      <CardContent>
        <form id={formId} onSubmit={handleSubmit} onReset={() => form.reset()}>
          {fields.fields.map((i, idx) => (
            <React.Fragment key={i.id}>
              <Controller
                control={form.control}
                name={`list.${idx}.key`}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={form.control}
                name={`list.${idx}.value`}
                render={({ field, fieldState }) => (
                  <NumberField
                    field={field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </React.Fragment>
          ))}
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
