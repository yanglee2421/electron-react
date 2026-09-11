import { spawn } from "node:child_process";
import fs from "node:fs";
import module from "node:module";
import path from "node:path";
import process from "node:process";
import url from "node:url";
import type { BuildOptions, ExternalOption } from "rolldown";
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

const require = module.createRequire(import.meta.url);
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const shimFile = path.resolve(__dirname, "esm-shims.ts");
const packageJsonPath = path.resolve(process.cwd(), "./package.json");
const packageJson = fs.readFileSync(packageJsonPath, "utf-8");
const { dependencies } = JSON.parse(packageJson);
const excludes = ["electron", ...Object.keys(dependencies)];
const includes = ["@yanglee2421/external-db"];
const calcExternal = (isDev: boolean): ExternalOption => {
  return (id, parentId, isResolved) => {
    void parentId;

    if (!isResolved) {
      // Excludes
      if (
        excludes.some((pkg) => {
          const reg = new RegExp(`^${pkg}/?`);

          return reg.test(id);
        })
      ) {
        return true;
      }

      // Includes
      if (
        includes.some((pkg) => {
          const reg = new RegExp(`^${pkg}/?`);

          return reg.test(id);
        })
      ) {
        return false;
      }

      // Relative path
      if (id.startsWith(".")) {
        return false;
      }

      // Alias path
      if (id.startsWith("#")) {
        return false;
      }

      // node_modules
      return isDev;
    } else {
      if (isDev) {
        return id.includes("node_modules");
      }

      return false;
    }
  };
};

const createPreloadInput = (): BuildOptions => {
  return {
    input: "src/preload/index.ts",
    output: {
      format: "cjs",
      codeSplitting: false,
      file: "out/preload/index.cjs",
    },
    platform: "node",
    external: ["electron"],
    transform: {
      inject: {
        __dirname: [shimFile, "__dirname"],
        __filename: [shimFile, "__filename"],
      },
    },
    plugins: [resources({ external: excludes })],
  };
};

const createMainInput = (isDev: boolean): BuildOptions => {
  return {
    input: "src/main/index.ts",
    output: {
      format: "esm",
      codeSplitting: false,
      file: "out/main/index.js",
    },
    platform: "node",
    external: calcExternal(isDev),
    transform: {
      inject: {
        __dirname: [shimFile, "__dirname"],
        __filename: [shimFile, "__filename"],
      },
    },
    plugins: [resources({ external: excludes })],
  };
};

const startWatch = (options: BuildOptions) => {
  return new Observable((sub) => {
    const watcher = watch(options);

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
};

const startElectron = (server: ViteDevServer) => {
  const ELECTRON_RENDERER_URL = server.resolvedUrls?.local.at(0) || "";

  return new Observable((sub) => {
    console.log("Starting Electron...");
    const ps = spawn(require("electron"), ["."], {
      stdio: "pipe",
      env: { ELECTRON_RENDERER_URL },
    });

    ps.on("error", (error) => {
      sub.error(error);
    });
    ps.on("spawn", () => {
      sub.next(ps);
    });
    ps.on("close", () => {
      sub.complete();
    });

    ps.stderr.addListener("data", (data) => {
      console.log(String(data));
    });
    ps.stdout.addListener("data", (data) => {
      console.log(String(data));
    });

    return () => {
      console.log("Stopping Electron...");
      ps.stdout.removeAllListeners();
      ps.stderr.removeAllListeners();
      ps.removeAllListeners();
      ps.kill();
    };
  }).pipe(
    tap({
      complete() {
        server.close();
      },
    }),
    catchError((error) => {
      console.error(error);

      return EMPTY;
    }),
  );
};

const startDev = (server: ViteDevServer) => {
  const http = server?.httpServer;

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
      return merge(
        startWatch(createPreloadInput()).pipe(
          debounceTime(1000 * 2),
          tap(() => {
            server.ws.send({ type: "full-reload" });
          }),
        ),
        startWatch(createMainInput(true)).pipe(
          debounceTime(1000 * 2),
          switchMap(() => startElectron(server)),
        ),
      );
    }),
    takeUntil(close$),
  );
};

const server$ = new Subject<ViteDevServer>();
const dev$ = server$.pipe(switchMap((server) => startDev(server)));

/**
 * vite.config.ts is re-executed whenever the Vite server restarts.
 * Store the previous subscription to avoid creating duplicate subscriptions.
 */
let subscribtion: Subscription | null = null;

export const electron = (): Plugin[] => {
  subscribtion?.unsubscribe();
  subscribtion = dev$.subscribe();

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
        await build([createPreloadInput(), createMainInput(false)]);
      },
    },
  ];
};
