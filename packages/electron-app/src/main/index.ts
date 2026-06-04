import {
  activate$,
  browserWindowCreated$,
  secondInstance$,
  whenReady$,
  willQuit$,
  windowAllClosed$,
} from "#main/infra/app-rxjs";
import { electronApp, is, platform } from "@electron-toolkit/utils";
import { asValue } from "awilix";
import dayjs from "dayjs";
import { app, BrowserWindow, Menu, net, protocol } from "electron";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import {
  defer,
  filter,
  from,
  map,
  NEVER,
  of,
  partition,
  retry,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  tap,
  timer,
  using,
} from "rxjs";
import { container } from "./features";
import * as cmdIPC from "./features/cmd/ipc";
import * as dbIPC from "./features/db/ipc";
import * as externalDBIPC from "./features/external-db/ipc";
import * as guangzhoubeiIPC from "./features/guangzhoubei/ipc";
import * as guangzhoujibaoduanIPC from "./features/guangzhoujibaoduan/ipc";
import * as hxzyIPC from "./features/hxzy/ipc";
import * as imageIPC from "./features/image/ipc";
import * as jtvIPC from "./features/jtv/ipc";
import * as khIPC from "./features/kh_hmis/ipc";
import * as kvIPC from "./features/kv/ipc";
import * as logIPC from "./features/logger/ipc";
import * as mdbIPC from "./features/mdb/ipc";
import * as plcIPC from "./features/plc/ipc";
import * as printerIPC from "./features/printer/ipc";
import * as xmlIPC from "./features/xml/ipc";
import * as infraIPC from "./infra/ipc";

/**
 * Avoid single instance in development version & production version
 */
if (is.dev) {
  const devUserDataPath = path.resolve(
    app.getPath("appData"),
    `./${app.getName()}-dev`,
  );
  app.setPath("userData", devUserDataPath);
}

if (is.dev) {
  app.setAsDefaultProtocolClient("app-ziyun", process.execPath, [
    path.resolve(process.argv[1]),
  ]);
} else {
  app.setAsDefaultProtocolClient("app-ziyun");
}

/**
 * Disable GPU & Sandbox to avoid crash
 */
if (platform.isLinux) {
  app.disableHardwareAcceleration();
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "ziyun",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

// Define rxjs observable
const singleInstanceLock$ = defer(() => of(app.requestSingleInstanceLock()));
const [primaryInstance$, duplicateInstance$] = partition(
  singleInstanceLock$.pipe(shareReplay(1)),
  (hasLock) => hasLock,
);

const ioc$ = using(
  () => {
    const dbPath = path.resolve(app.getPath("userData"), "db.db");
    container.register({ dbPath: asValue(dbPath) });

    const { db } = container.cradle;
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
    const migrationsFolder = path.resolve(__dirname, "../../drizzle");
    db.migrate(migrationsFolder);

    const {
      cmd,
      externalDB,
      guangzhoubei,
      guangzhoujibaoduan,
      hmisProxy,
      hxzy,
      image,
      jtv,
      kh,
      kv,
      logger,
      mdb,
      plc,
      printer,

      appTheme,
      appTray,
      appWindow,
    } = container.cradle;
    const infraUnIPC = infraIPC.registerIPCHandlers();

    const cmdUnIPC = cmdIPC.registerIPCHandlers(cmd);
    const externalDBUnIPC = externalDBIPC.registerIPCHandlers(externalDB);
    const dbUnIPC = dbIPC.registerIPCHandlers(db);
    const guangzhoubeiUnIPC = guangzhoubeiIPC.registerIPCHandlers(guangzhoubei);
    const guangzhoujibaoduanUnIPC =
      guangzhoujibaoduanIPC.registerIPCHandlers(guangzhoujibaoduan);
    void hmisProxy;
    const hxzyUnIPC = hxzyIPC.registerIPCHandlers(hxzy);
    const imageUnIPC = imageIPC.registerIPCHandlers(image);
    const jtvUnIPC = jtvIPC.registerIPCHandlers(jtv);
    const khUnIPC = khIPC.registerIPCHandlers(kh);
    const kvUnIPC = kvIPC.registerIPCHandlers(kv);
    const logUnIPC = logIPC.registerIPCHandlers(logger);
    const mdbUnIPC = mdbIPC.registerIPCHandlers(mdb);
    const plcUnIPC = plcIPC.registerIPCHandlers(plc);
    const printerUnIPC = printerIPC.registerIPCHandlers(printer);
    const xmlUnIPC = xmlIPC.registerIPCHandlers();

    protocol.handle("ziyun", (request) => {
      const filePath = new URL(request.url).searchParams.get("file")!;

      return net.fetch(url.pathToFileURL(filePath).href);
    });

    void appTheme;
    void appTray;
    void appWindow;

    return {
      unsubscribe: () => {
        infraUnIPC();

        cmdUnIPC();
        dbUnIPC();
        externalDBUnIPC();
        guangzhoubeiUnIPC();
        guangzhoujibaoduanUnIPC();
        hxzyUnIPC();
        imageUnIPC();
        jtvUnIPC();
        khUnIPC();
        kvUnIPC();
        logUnIPC();
        mdbUnIPC();
        plcUnIPC();
        printerUnIPC();
        xmlUnIPC();

        container.dispose();
        protocol.unhandle("ziyun");
      },
    };
  },
  // A value must be emitted to trigger the callback function passed to the subscriber,
  // Even if we don't actually need it
  () => NEVER.pipe(startWith(null)),
).pipe(takeUntil(willQuit$), shareReplay({ bufferSize: 1, refCount: true }));

// Subscribe Observerable

duplicateInstance$.subscribe(() => {
  if (is.dev) {
    console.warn(
      "Another instance of the app is already running. This instance will be closed.",
    );
  }

  app.quit();
});

primaryInstance$
  .pipe(
    switchMap(() => whenReady$),
    switchMap(() => ioc$),
    retry({
      count: 1,
      delay: () => {
        return from(container.dispose()).pipe(
          tap(() => {
            const dbPath = path.resolve(app.getPath("userData"), "db.db");
            const desktopDbPath = path.resolve(
              app.getPath("desktop"),
              `db-backup-${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.db`,
            );

            fs.cpSync(dbPath, desktopDbPath, { recursive: true });
            fs.rmSync(dbPath, { recursive: true, force: true });
          }),
          switchMap(() => timer(200)),
        );
      },
    }),
  )
  .subscribe(() => {
    Menu.setApplicationMenu(null);

    if (platform.isWindows) {
      electronApp.setAppUserModelId("com.electron");
    }

    const { profile, appWindow, appOpenURL } = container.cradle;

    if (!profile.state.silentStartUp) {
      appWindow.show();
    }

    const openURL = process.argv.find((arg) => arg.startsWith("app-ziyun://"));
    appOpenURL.emit(openURL);
    console.log("primaryInstance", openURL);
  });

activate$
  .pipe(
    filter(() => {
      return BrowserWindow.getAllWindows().length === 0;
    }),
  )
  .subscribe(() => {
    const win = container.cradle.appWindow;
    win.show();
  });

secondInstance$.subscribe(([, cmds]) => {
  const url = cmds.at(-1);
  const { appOpenURL, appWindow } = container.cradle;

  appOpenURL.emit(url);
  console.log("secondInstance", url);
  appWindow.show();
});

browserWindowCreated$
  .pipe(
    map(([, win]) => win),
    tap((win) => {
      win.on("focus", () => {
        win.webContents.send("windowFocus");
      });
      win.on("blur", () => {
        win.webContents.send("windowBlur");
      });
      // Only fire when the win.show is called on Windows
      win.on("show", () => {
        win.webContents.send("windowShow");
      });
      // Only fire when the win.hide is called on Windows
      win.on("hide", () => {
        win.webContents.send("windowHide");
      });
    }),
  )
  .subscribe();

windowAllClosed$.pipe(filter(() => !platform.isMacOS)).subscribe(() => {
  const profile = container.cradle.profile;

  if (profile.state.enableTray) {
    return;
  }

  app.quit();
});
