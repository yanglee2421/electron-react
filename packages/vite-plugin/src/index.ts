import { spawn } from "node:child_process";
import module from "node:module";
import path from "node:path";
import process from "node:process";
import url from "node:url";
import type { BuildOptions } from "rolldown";
import { build, watch } from "rolldown";
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
import { worker } from "./worker.ts";
export { reactDevtools } from "./react-devtools.ts";

const require = module.createRequire(import.meta.url);
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const shimFile = path.resolve(__dirname, "esm-shims.ts");

const preloadInput: BuildOptions = {
  input: "src/preload/index.ts",
  output: {
    format: "cjs",
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
};

const mainInput: BuildOptions = {
  input: "src/main/index.ts",
  output: {
    format: "esm",
    file: "out/main/index.js",
  },
  platform: "node",

  external: [
    "electron",
    "@yanglee2421/cpp-addon",
    "fast-xml-parser",
    "pdf-parse",
    "pdf-parse/worker",
    "pdfjs-dist",
    "piscina",
    "serialport",
  ],
  transform: {
    inject: {
      __dirname: [shimFile, "__dirname"],
      __filename: [shimFile, "__filename"],
    },
  },
  plugins: [worker()],
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
    if (e.code === "BUNDLE_END") {
      sub.next(null);
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
    const id = Date.now();
    const cp = spawn(require("electron"), ["."], {
      stdio: "inherit",
      env: { ELECTRON_RENDERER_URL },
    });

    cp.on("error", (error) => {
      sub.error(error);
    });
    cp.on("spawn", () => {
      sub.next(cp);
      console.log("spawn", id);
    });
    cp.on("exit", () => {
      sub.complete();
      console.log("exit", id);
      process.exit();
    });

    return () => {
      cp.removeAllListeners();
      console.log("kill", id, cp.kill("SIGKILL"));
    };
  }).pipe(
    catchError((error) => {
      console.error(error);

      return EMPTY;
    }),
  );
};

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
      switchMap(() => {
        const RENDERER_URL = devServer.resolvedUrls?.local.at(0) || "";

        return merge(
          watchPreload$.pipe(
            debounceTime(1000 * 2),
            tap(() => {
              devServer.ws.send({ type: "full-reload" });
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

export const electron = (): Plugin[] => {
  server$.subscribe();

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
        serverCreated$.next(server);
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
