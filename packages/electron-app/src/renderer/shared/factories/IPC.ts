import type { IpcContract } from "#main/lib/ipc";

export type Args<TKey extends keyof IpcContract> = IpcContract[TKey] extends {
  args: infer TArgs;
}
  ? TArgs extends unknown[]
    ? TArgs
    : []
  : never;

export type Return<TKey extends keyof IpcContract> = IpcContract[TKey] extends {
  return: infer TReturn;
}
  ? Promise<Awaited<TReturn>>
  : never;

export class IPC {
  ipcInvoke<TKey extends keyof IpcContract>(
    key: TKey,
    ...args: Args<TKey>
  ): Return<TKey> {
    return window.electron.ipcRenderer.invoke(key, ...args) as Return<TKey>;
  }

  getItem(name: string): Promise<string | null> {
    return this.ipcInvoke("kv/get", name);
  }
  setItem(name: string, value: string): Promise<void> {
    return this.ipcInvoke("kv/set", name, value);
  }
  removeItem(name: string): Promise<void> {
    return this.ipcInvoke("kv/remove", name);
  }
}
