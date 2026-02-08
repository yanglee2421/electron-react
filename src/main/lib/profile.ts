import * as fs from "node:fs";
import * as path from "node:path";
import ini from "ini";
import { z } from "zod";
import iconv from "iconv-lite";
import { produce } from "immer";
import { BrowserWindow, nativeTheme, net, protocol } from "electron";
import { ipcHandle } from "#main/lib/ipc";
import type { AppContext } from "#main/index";

type Mode = "system" | "light" | "dark";
type CallbackFn<TArgs extends unknown[], TReturn> = (...args: TArgs) => TReturn;
export type Profile = z.infer<typeof ProfileStore.profileSchema>;

export class ProfileStore {
  static modeSchema = z.enum(["system", "light", "dark"]).default("system");
  static profileSchema = z.object({
    appPath: z.string().default(""),
    encoding: z.string().default("gbk"),
    alwaysOnTop: z.boolean().default(false),
    mode: this.modeSchema,
  });

  #listeners = new Set<CallbackFn<[Profile, Profile], void>>();
  #cache: Profile | null = null;
  #filePath: string;

  constructor(filePath: string) {
    this.#filePath = filePath;
  }

  async getState() {
    if (this.#cache) {
      return this.#cache;
    }

    try {
      const json = await fs.promises.readFile(this.#filePath, "utf-8");
      this.#cache = ProfileStore.profileSchema.parse(JSON.parse(json));
    } catch (error) {
      this.#cache = ProfileStore.profileSchema.parse({});

      if (import.meta.env.DEV) {
        console.error(error);
      }
    }

    return this.#cache;
  }
  async setState(callback: CallbackFn<[Profile], void>) {
    const previous = await this.getState();
    const next = produce(previous, callback);
    await fs.promises.writeFile(this.#filePath, JSON.stringify(next), "utf-8");
    this.#cache = next;

    this.#listeners.forEach((callbackFn) => {
      try {
        callbackFn(previous, next);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(error);
        }
      }
    });
  }
  subscribe(listener: CallbackFn<[Profile, Profile], void>) {
    this.#listeners.add(listener);

    return () => {
      this.unsubscribe(listener);
    };
  }
  unsubscribe(listener: CallbackFn<[Profile, Profile], void>) {
    this.#listeners.delete(listener);
  }

  async getRootPath() {
    const profileInfo = await this.getState();
    const appPath = profileInfo.appPath;
    const iniPath = path.resolve(appPath, "usprofile.ini");
    const iniBuffer = await fs.promises.readFile(iniPath);
    const iniText = iconv.decode(iniBuffer, profileInfo.encoding);
    const userProfile = ini.parse(iniText);
    const rootPath = userProfile.FileSystem.Root as string;

    return rootPath;
  }
  async getRootDBPath() {
    const rootPath = await this.getRootPath();

    return path.resolve(rootPath, "local.mdb");
  }
  async getAppDBPath() {
    const state = await this.getState();
    const appPath = state.appPath;

    return path.resolve(appPath, "Data", "local.mdb");
  }

  bindIpcHandlers(appContext: AppContext) {
    void appContext;

    const diffMode = (prev: Mode, next: Mode) => {
      if (Object.is(prev, next)) return;

      nativeTheme.themeSource = next;
    };

    const diffAlwaysOnTop = (prev: boolean, next: boolean) => {
      if (Object.is(prev, next)) return;

      BrowserWindow.getAllWindows().forEach((win) => {
        win.setAlwaysOnTop(next);
      });
    };

    const diffAppPath = (prev: string, next: string) => {
      if (Object.is(prev, next)) return;

      protocol.unhandle("atom");
      protocol.handle("atom", async (request) => {
        const fileName = request.url.replace(/^atom:\/\//, "");
        const rootPath = await this.getRootPath();
        const fetchURL = path.join(rootPath, "_data", fileName);

        return net.fetch(`file://${fetchURL}`);
      });
    };

    this.subscribe((prev, next) => {
      diffMode(prev.mode, next.mode);
      diffAlwaysOnTop(prev.alwaysOnTop, next.alwaysOnTop);
      diffAppPath(prev.appPath, next.appPath);
    });

    ipcHandle("PROFILE/GET", async () => {
      const profile = await this.getState();

      return profile;
    });
    ipcHandle("PROFILE/SET", async (_, payload: Partial<Profile>) => {
      await this.setState((profile) => {
        Object.assign(profile, payload);
      });

      const updated = await this.getState();

      return updated;
    });
  }
}
