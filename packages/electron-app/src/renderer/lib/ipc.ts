import type { IPCContract } from "#main/ipc/types";

type Args<TKey extends keyof IPCContract> = IPCContract[TKey] extends {
  args: infer TArgs;
}
  ? TArgs extends unknown[]
    ? TArgs
    : []
  : never;

type Return<TKey extends keyof IPCContract> = IPCContract[TKey] extends {
  return: infer TReturn;
}
  ? Promise<Awaited<TReturn>>
  : never;

class IPC {
  invoke<TKey extends keyof IPCContract>(
    key: TKey,
    ...args: Args<TKey>
  ): Return<TKey> {
    return window.electron.ipcRenderer.invoke(key, ...args) as Return<TKey>;
  }

  getItem(name: string): Promise<string | null> {
    return this.invoke("kv/get", name);
  }
  setItem(name: string, value: string): Promise<void> {
    return this.invoke("kv/set", name, value);
  }
  removeItem(name: string): Promise<void> {
    return this.invoke("kv/remove", name);
  }
}

export const ipc = new IPC();
