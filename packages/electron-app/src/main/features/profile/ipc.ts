import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Profile } from "./profile";

export const registerIPCHandlers = (profile: Profile) => {
  ipcHandle("profile/get", () => {
    return profile.state;
  });

  return () => {
    ipcRemoveHandle("profile/get");
  };
};
