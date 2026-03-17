import { PROFILE_STORAGE_KEY } from "#shared/instances/constants";
import { profile, type Profile as ProfileType } from "#shared/instances/schema";
import iconv from "iconv-lite";
import ini from "ini";
import fs from "node:fs";
import path from "node:path";
import type { KV } from "./KV";

export class Profile {
  private state = Object.freeze(profile.parse({}));
  private handles = new Set<
    (state: ProfileType, previous: ProfileType) => void
  >();
  private kv: KV;

  constructor(kv: KV) {
    this.kv = kv;

    this.kv.on((key) => {
      if (key === PROFILE_STORAGE_KEY) {
        void this.hydrate();
      }
    });
  }

  async hydrate() {
    const value = await this.kv.getItem(PROFILE_STORAGE_KEY);

    if (!value) return;

    const previous = this.state;
    const data = JSON.parse(value);

    this.state = Object.freeze(profile.parse(data.state));
    this.emit(this.state, previous);
  }

  getState() {
    return this.state;
  }

  async getRootPath() {
    const profileInfo = this.getState();
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
  getAppDBPath() {
    const state = this.getState();
    const appPath = state.appPath;

    return path.resolve(appPath, "Data", "local.mdb");
  }

  on(handle: (state: ProfileType, previous: ProfileType) => void) {
    this.handles.add(handle);

    return () => {
      this.off(handle);
    };
  }
  off(handle: (state: ProfileType, previous: ProfileType) => void) {
    this.handles.delete(handle);
  }
  emit(state: ProfileType, previous: ProfileType) {
    this.handles.forEach((handle) => {
      handle(state, previous);
    });
  }
}
