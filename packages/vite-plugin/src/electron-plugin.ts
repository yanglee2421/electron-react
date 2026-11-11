import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import {
  catchError,
  debounceTime,
  EMPTY,
  filter,
  fromEventPattern,
  map,
  merge,
  Observable,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import type { Logger, Plugin, ViteDevServer } from "vite-plus";
import { build } from "vite-plus/pack";
import { assetsPlugin } from "./assets-plugin.ts";
import { workerPlugin } from "./worker-plugin.ts";

const require = createRequire(import.meta.url);

let logger: Logger | null = null;

const buildPreload$ = new Observable((sub) => {
  const promise = build({
    watch: true,
    hooks(hooks) {
      hooks.hook("build:prepare", () => {});
      hooks.hook("build:before", () => {});
      hooks.hook("build:done", () => {
        sub.next(null);
      });
    },

    entry: "src/preload/index.ts",
    deps: {
      neverBundle: true,
    },

    outputOptions() {
      return {
        dir: "out/preload",
        entryFileNames: "index.cjs",
        format: "cjs",
      };
    },
    shims: true,
  });

  return async () => {
    const handle = await promise;
    await handle.watch.close();
  };
});
const buildMain$ = new Observable((sub) => {
  const promise = build({
    watch: true,
    hooks(hooks) {
      hooks.hook("build:prepare", () => {});
      hooks.hook("build:before", () => {});
      hooks.hook("build:done", () => {
        sub.next(null);
      });
    },

    entry: "src/main/index.ts",
    deps: {
      neverBundle: true,
    },

    outputOptions() {
      return {
        dir: "out/main",
        entryFileNames: "index.js",
        format: "esm",
      };
    },
    shims: true,

    plugins: [assetsPlugin(), workerPlugin()],
  });

  return async () => {
    const handle = await promise;
    await handle.watch.close();
  };
});
const startElectron = (server: ViteDevServer) => {
  const ELECTRON_RENDERER_URL = server.resolvedUrls?.local.at(0) || "";

  return new Observable((sub) => {
    logger?.info("[electron] Starting Electron...");
    const ps = spawn(require("electron"), ["."], {
      stdio: "pipe",
      env: { ELECTRON_RENDERER_URL },
    });

    ps.on("spawn", () => {
      sub.next(ps);
    });
    ps.on("error", (error) => {
      sub.error(error);
    });
    ps.on("close", () => {
      sub.complete();
    });

    const outData$ = fromEventPattern<Buffer>(
      (h) => ps.stdout.on("data", h),
      (h) => ps.stdout.off("data", h),
    );
    const errData$ = fromEventPattern<Buffer>(
      (h) => ps.stderr.on("data", h),
      (h) => ps.stderr.off("data", h),
    );

    const subOut = outData$
      .pipe(
        map((data) => String(data).trim()),
        filter((msg) => msg.length > 0),
      )
      .subscribe((data) => {
        logger?.info(`[electron] out` + data);
      });

    const subError = errData$
      .pipe(
        map((data) => String(data).trim()),
        filter((msg) => msg.length > 0),
      )
      .subscribe((data) => {
        logger?.error(`[electron] err` + data);
      });

    return () => {
      logger?.info("[electron] Stopping Electron...");
      ps.stdout.removeAllListeners();
      ps.stderr.removeAllListeners();
      ps.removeAllListeners();
      ps.kill();
      subOut.unsubscribe();
      subError.unsubscribe();
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
const server$ = new Subject<ViteDevServer>();
const dev$ = server$.pipe(
  switchMap((server) => {
    const { httpServer } = server;

    if (!httpServer) {
      return EMPTY;
    }

    const listening$ = fromEventPattern(
      (h) => httpServer.on("listening", h),
      (h) => httpServer.off("listening", h),
    );
    const close$ = fromEventPattern(
      (h) => httpServer.on("close", h),
      (h) => httpServer.off("close", h),
    );

    return listening$.pipe(
      switchMap(() => {
        return merge(
          buildPreload$.pipe(
            debounceTime(1000 * 2),
            tap(() => {
              server.ws.send({ type: "full-reload" });
            }),
          ),
          buildMain$.pipe(
            debounceTime(1000 * 2),
            switchMap(() => startElectron(server)),
          ),
        );
      }),
      takeUntil(close$),
    );
  }),
);

dev$.subscribe();

export const electronPlugin = (): Plugin[] => {
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
      configResolved(config) {
        logger = config.logger;
      },
      configureServer(server) {
        server$.next(server);
      },
      closeServer() {},
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
        await build({
          entry: "src/preload/index.ts",
          deps: {
            neverBundle: ["electron"],
          },

          outputOptions() {
            return {
              dir: "out/preload",
              entryFileNames: "index.cjs",
              format: "cjs",
            };
          },
          shims: true,
        });
        await build({
          entry: "src/main/index.ts",
          deps: {
            neverBundle: ["electron"],
          },

          outputOptions() {
            return {
              dir: "out/main",
              entryFileNames: "index.js",
              format: "esm",
            };
          },
          shims: true,

          plugins: [assetsPlugin(), workerPlugin()],
        });
      },
    },
  ];
};
