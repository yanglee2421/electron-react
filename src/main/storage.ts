import { app } from "electron/main";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { z } from "zod";
import { t } from "#/lib/try";
import { devError, debounce } from "#/lib/utils";

const STORAGE_FILENAME = "storage.json";

const getStoragePath = () =>
  path.join(app.getPath("userData"), STORAGE_FILENAME);

const saveToFile = async (data: unknown) => {
  const json = JSON.stringify(data);
  const filePath = getStoragePath();
  await fs.writeFile(filePath, json, "utf-8");
};

const saveToFileWithCatch = async (data: unknown) => {
  const [ok, error] = await t(saveToFile, data);

  if (ok) {
    return;
  } else {
    devError(error);
  }
};

const debounceSaveToFile = debounce(saveToFileWithCatch);

const createRecursiveProxy = <TTarget extends NonNullable<unknown>>(
  target: TTarget,
) =>
  new Proxy<TTarget>(target, {
    get(object, property) {
      const value = Reflect.get(object, property);

      if (typeof value !== "object") {
        return value;
      }

      // value is null
      if (!value) {
        return value;
      }

      // Other object
      return createRecursiveProxy(value);
    },
    set(object, property, value) {
      const result = Reflect.set(object, property, value);

      if (result) {
        debounceSaveToFile(object);
      }

      return result;
    },
  });

const schema = z.object({
  name: z.string().default(""),
  profile: z
    .object({
      homePath: z.string().default("/settings"),
    })
    .default({
      homePath: "/settings",
    }),
});

const getValue = async () => {
  const filePath = getStoragePath();
  const json = await fs.readFile(filePath, "utf-8");
  const presisted = JSON.parse(json);
  const parsed = schema.safeParse(presisted);

  if (parsed.success) {
    return parsed.data;
  }

  return schema.parse({});
};

let ref;
let values: z.infer<typeof schema>;
let hasHydrated = false;

const hydrate = async () => {
  const [ok, error, result] = await t(getValue);

  if (ok) {
    values = result;
  } else {
    devError(error);
  }

  hasHydrated = true;
};

export const getRef = async () => {
  if (!hasHydrated) {
    await hydrate();
  }

  ref = createRecursiveProxy(values);
  return ref;
};
