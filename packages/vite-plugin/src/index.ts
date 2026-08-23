import { spawn } from "node:child_process";
import module from "node:module";
import path from "node:path";
import url from "node:url";
import type { BuildOptions } from "rolldown";
import { build, watch } from "rolldown";
import {
  EMPTY,
  Observable,
  Subject,
  debounceTime,
  fromEventPattern,
  merge,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import type { Plugin, ViteDevServer } from "vite";
import { workerUrlPlugin } from "./worker-url.ts";

const require = module.createRequire(import.meta.url);
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const shimFile = path.resolve(__dirname, "esm-shims.ts");

const processExit$ = fromEventPattern(
  (f) => process.on("exit", f),
  (f) => process.off("exit", f),
);

const processSigint = fromEventPattern(
  (f) => process.on("SIGINT", f),
  (f) => process.off("SIGINT", f),
).pipe(
  tap(() => {
    process.exit();
  }),
);

const processSigterm = fromEventPattern(
  (f) => process.on("SIGTERM", f),
  (f) => process.off("SIGTERM", f),
).pipe(
  tap(() => {
    process.exit();
  }),
);

const rolldownInputs: BuildOptions[] = [
  {
    input: "src/preload/index.ts",
    output: {
      format: "cjs",
      file: "out/preload/index.cjs",
      dir: "out/preload",
      cleanDir: true,
    },
    external: ["electron", /^node:/],
    platform: "node",
    transform: {
      inject: {
        __dirname: [shimFile, "__dirname"] as [string, string],
        __filename: [shimFile, "__filename"] as [string, string],
      },
    },
  },
  {
    input: "src/main/index.ts",
    output: {
      format: "esm",
      file: "out/main/index.js",
      dir: "out/main",
      cleanDir: true,
    },
    external: ["electron", /^node:/],
    platform: "node",
    transform: {
      inject: {
        __dirname: [shimFile, "__dirname"] as [string, string],
        __filename: [shimFile, "__filename"] as [string, string],
      },
    },
    plugins: [workerUrlPlugin()],
  },
];

const electronMain$ = new Observable((sub) => {
  const watcher = watch(rolldownInputs);

  watcher.on("event", (e) => {
    if (e.code === "BUNDLE_END") {
      sub.next(null);
    }
  });

  return () => {
    watcher.close();
  };
}).pipe(
  debounceTime(1000 * 2),
  tap(() => {
    console.log("tap");
  }),
  switchMap(() => {
    return new Observable((sub) => {
      const id = Date.now();

      const cp = spawn(require("electron"), ["."], {
        stdio: "inherit",
        detached: true,
      });

      cp.on("error", (error) => {
        sub.error(error);
      });

      cp.on("spawn", () => {
        console.log("spawn", id);
        sub.next(cp);
      });

      cp.on("exit", () => {
        console.log("exit", id);
        sub.complete();
        process.exit();
      });

      return () => {
        cp.removeAllListeners();
        console.log("kill", id, cp.kill("SIGKILL"));
      };
    });
  }),
  takeUntil(merge(processExit$, processSigint, processSigterm)),
);

const serverCreated$ = new Subject<ViteDevServer | null>();
const server$ = serverCreated$.pipe(
  switchMap((devServer) => {
    const http = devServer?.httpServer;

    if (!http) {
      return EMPTY;
    }

    const close$ = fromEventPattern(
      (f) => http.on("close", f),
      (f) => http.off("close", f),
    );

    const listening$ = fromEventPattern(
      (f) => http.on("listening", f),
      (f) => http.off("listening", f),
    );

    return listening$.pipe(
      tap(() => {
        console.log(devServer.resolvedUrls?.local);
      }),
      switchMap(() => {
        return electronMain$;
      }),
      takeUntil(close$),
    );
  }),
);

export const vitePluginElectron = (): Plugin[] => {
  server$.subscribe();

  return [
    {
      name: "vite-plugin-electron-dev",
      apply: "serve",
      config() {
        return {
          server: {
            watch: {
              ignored: [
                "**/out/**",
                "**/release/**",
                "**/src/main/**",
                "**/src/preload/**",
              ],
            },
          },
        };
      },
      configResolved(config) {
        console.log(config.command);
      },
      configureServer(server) {
        serverCreated$.next(server);
      },
    },
    {
      name: "vite-plugin-electron-build",
      apply: "build",
      config() {
        return {
          build: {
            outDir: "./out/renderer",
            emptyOutDir: true,
          },
          base: "./",
        };
      },

      async closeBundle() {
        await build(rolldownInputs);
      },
    },
  ];
};
