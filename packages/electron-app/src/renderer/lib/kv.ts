export const getKVStorage = () => {
  return {
    async getItem(key: string): Promise<string | null> {
      const value = await window.electron.ipcRenderer.invoke("kv/get", key);

      return value;
    },
    async setItem(key: string, value: string): Promise<void> {
      await window.electron.ipcRenderer.invoke("kv/set", key, value);
    },
    async removeItem(key: string): Promise<void> {
      await window.electron.ipcRenderer.invoke("kv/remove", key);
    },
  };
};
