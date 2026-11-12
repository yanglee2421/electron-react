import type { Plugin } from "vite-plus";

export const reactDevtoolsPlugin = (enabled?: boolean): Plugin => {
  return {
    name: "vite-plugin-react-devtools-injector",
    apply: "serve",
    transformIndexHtml() {
      if (!enabled) return;

      return [
        {
          tag: "script",
          attrs: { src: "http://localhost:8097" },
          injectTo: "head-prepend",
        },
      ];
    },
  };
};
