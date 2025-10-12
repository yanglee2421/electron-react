import { app, BrowserWindow, nativeTheme } from "electron";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { z } from "zod";
import { produce } from "immer";
import { channel } from "../channel";
import type { WritableDraft } from "immer";
import { ipcHandle } from "#main/lib";
import ini from "ini";
import iconv from "iconv-lite";

const modeSchema = z.enum(["system", "light", "dark"]).default("system");

type Mode = z.infer<typeof modeSchema>;

const profileSchema = z.object({
  appPath: z.string().default(""),
  encoding: z.string().default("gbk"),
  driverPath: z.string().default(""),
  alwaysOnTop: z.boolean().default(false),
  mode: modeSchema,
});

// Shared Logic
const getFilePath = () => path.resolve(app.getPath("userData"), "profile.json");

const getAppPath = async () => {
  const profile = await getProfile();
  return [profile.appPath, profile] as const;
};

export const getAppDBPath = async () => {
  const [appPath] = await getAppPath();
  return path.resolve(appPath, "Data", "local.mdb");
};

export const getRootPath = async () => {
  const [appPath, profile] = await getAppPath();
  const iniPath = path.resolve(appPath, "usprofile.ini");
  const iniBuffer = await fs.readFile(iniPath);
  const iniText = iconv.decode(iniBuffer, profile.encoding);
  const userProfile = ini.parse(iniText);
  const rootPath = userProfile.FileSystem.Root as string;

  return rootPath;
};

export const getRootDBPath = async () => {
  const rootPath = await getRootPath();

  return path.resolve(rootPath, "local.mdb");
};

export type Profile = z.infer<typeof profileSchema>;

export const getProfile = async () => {
  const filePath = getFilePath();
  try {
    const text = await fs.readFile(filePath, "utf-8");
    const raw = JSON.parse(text);
    const parsed = profileSchema.parse(raw);
    return parsed;
  } catch {
    const fallbackProfile = profileSchema.parse({});
    return fallbackProfile;
  }
};

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

type ProfileCallback = (profile: WritableDraft<Profile>) => void;

export const setProfile = async (callback: ProfileCallback) => {
  const filePath = getFilePath();
  const previous = await getProfile();
  const data = produce(previous, callback);

  await fs.writeFile(filePath, JSON.stringify(data), {
    encoding: "utf-8",
  });

  diffMode(previous.mode, data.mode);
  diffAlwaysOnTop(previous.alwaysOnTop, data.alwaysOnTop);

  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send(channel.PROFILE_SET, data);
  });
};

export const bindIpcHandler = () => {
  ipcHandle(channel.PROFILE_GET, getProfile);
  ipcHandle(channel.PROFILE_SET, async (_, payload: Partial<Profile>) => {
    await setProfile((profile) => {
      Object.assign(profile, payload);
    });
    const updated = await getProfile();
    return updated;
  });
};
