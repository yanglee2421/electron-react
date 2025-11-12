export const invoke = window.electron.ipcRenderer.invoke.bind(
  window.electron.ipcRenderer,
);
