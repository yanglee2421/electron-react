import { app } from "electron/main";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { z } from "zod";

type CreateProxy = <TData extends NonNullable<unknown>>(
  data: TData,
  onChange: () => void,
) => TData;

const createProxy: CreateProxy = (data, onChange) =>
  new Proxy(data, {
    get(object, property) {
      const value = Reflect.get(object, property);

      if (typeof value !== "object") {
        return value;
      }

      if (!value) {
        return null;
      }

      return createProxy(value, onChange);
    },
    set(object, property, value) {
      const result = Reflect.set(object, property, value);

      if (result) {
        onChange();
      }

      return result;
    },
  });

class StorageRef<TData extends NonNullable<unknown>> {
  private current: TData | null = null;
  private timer: NodeJS.Timeout | undefined;
  private data: TData;
  private filePath: string;
  constructor(
    private parse: (data: unknown) => TData,
    private filename: string,
  ) {
    this.data = this.parse({});
    this.filePath = path.join(app.getPath("userData"), this.filename);
  }

  private async save() {
    clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      try {
        const json = JSON.stringify(this.data);
        await fs.writeFile(this.filePath, json, "utf-8");
      } catch (error) {
        console.error(error);
      }
    }, 200);
  }

  private async hydrate() {
    try {
      const json = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(json);
      this.data = this.parse(parsed);
    } catch (error) {
      console.error(error);
    }
  }

  async ref() {
    if (!this.current) {
      await this.hydrate();
    }

    this.current ||= createProxy(this.data, () => this.save());
    return this.current;
  }
}

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

const STORAGE_FILENAME = "storage.json";
export const storageRef = new StorageRef(schema.parse, STORAGE_FILENAME);
