import { spawn } from "node:child_process";
import fs from "node:fs";
import module from "node:module";
import path from "node:path";
import process from "node:process";
import url from "node:url";
import type { BuildOptions } from "rolldown";
import { build, watch } from "rolldown";
import type { Subscription } from "rxjs";
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  debounceTime,
  fromEventPattern,
  merge,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import type { Plugin, ViteDevServer } from "vite";
import { resources } from "./resources.ts";
export { reactDevtools } from "./react-devtools.ts";

const require = module.createRequire(import.meta.url);
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const shimFile = path.resolve(__dirname, "esm-shims.ts");
const packageJsonPath = path.resolve(process.cwd(), "./package.json");
const packageJson = fs.readFileSync(packageJsonPath, "utf-8");
const { dependencies } = JSON.parse(packageJson);
const external = ["electron", "pdf-parse/worker", ...Object.keys(dependencies)];

const preloadInput: BuildOptions = {
  input: "src/preload/index.ts",
  output: {
    format: "cjs",
    codeSplitting: false,
    file: "out/preload/index.cjs",
  },
  platform: "node",
  external,
  transform: {
    inject: {
      __dirname: [shimFile, "__dirname"],
      __filename: [shimFile, "__filename"],
    },
  },
  plugins: [resources({ external })],
};

const mainInput: BuildOptions = {
  input: "src/main/index.ts",
  output: {
    format: "esm",
    codeSplitting: false,
    file: "out/main/index.js",
  },
  platform: "node",
  external,
  transform: {
    inject: {
      __dirname: [shimFile, "__dirname"],
      __filename: [shimFile, "__filename"],
    },
  },
  plugins: [resources({ external })],
};

const exit$ = fromEventPattern(
  (f) => process.on("exit", f),
  (f) => process.off("exit", f),
);
const sigint$ = fromEventPattern(
  (f) => process.on("SIGINT", f),
  (f) => process.off("SIGINT", f),
).pipe(
  tap(() => {
    process.exit();
  }),
);
const sigterm$ = fromEventPattern(
  (f) => process.on("SIGTERM", f),
  (f) => process.off("SIGTERM", f),
).pipe(
  tap(() => {
    process.exit();
  }),
);

const watchPreload$ = new Observable((sub) => {
  const watcher = watch(preloadInput);

  watcher.on("event", (e) => {
    switch (e.code) {
      case "ERROR":
        console.error(e.error);
        break;
      case "BUNDLE_END":
        sub.next(null);
        break;
      case "START":
      case "BUNDLE_START":
      case "END":
      default:
    }
  });

  return () => {
    watcher.clear("event");
    watcher.close();
  };
});

const watchMain$ = new Observable((sub) => {
  const watcher = watch(mainInput);

  watcher.on("event", (e) => {
    switch (e.code) {
      case "ERROR":
        console.error(e.error);
        break;
      case "BUNDLE_END":
        sub.next(null);
        break;
      case "START":
      case "BUNDLE_START":
      case "END":
      default:
    }
  });

  return () => {
    watcher.clear("event");
    watcher.close();
  };
});

const startElectron = (ELECTRON_RENDERER_URL: string) => {
  return new Observable((sub) => {
    const cp = spawn(require("electron"), ["."], {
      stdio: "inherit",
      env: { ELECTRON_RENDERER_URL },
    });

    cp.on("error", (error) => {
      sub.error(error);
    });
    cp.on("spawn", () => {
      sub.next(cp);
    });
    cp.on("close", () => {
      sub.complete();
      process.exit();
    });

    return () => {
      cp.removeAllListeners();
      cp.kill("SIGKILL");
    };
  }).pipe(
    catchError((error) => {
      console.error(error);

      return EMPTY;
    }),
  );
};

const server$ = new Subject<ViteDevServer>();
const startDev$ = server$.pipe(
  switchMap((server) => {
    const http = server.httpServer;

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
      switchMap(() => {
        const RENDERER_URL = server.resolvedUrls?.local.at(0) || "";

        return merge(
          watchPreload$.pipe(
            debounceTime(1000 * 2),
            tap(() => {
              server.ws.send({ type: "full-reload" });
            }),
          ),
          watchMain$.pipe(
            debounceTime(1000 * 2),
            switchMap(() => startElectron(RENDERER_URL)),
            takeUntil(merge(exit$, sigint$, sigterm$)),
          ),
        );
      }),
      takeUntil(close$),
    );
  }),
);

/**
 * vite.config.ts is re-executed whenever the Vite server restarts.
 * Store the previous subscription to avoid creating duplicate subscriptions.
 */
let subscribtion: Subscription | null = null;

export const electron = (): Plugin[] => {
  subscribtion?.unsubscribe();
  subscribtion = startDev$.subscribe();

  return [
    {
      name: "electron:dev",
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
      configureServer(server) {
        server$.next(server);
      },
    },
    {
      name: "electron:build",
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
        await build([preloadInput, mainInput]);
      },
    },
  ];
};
