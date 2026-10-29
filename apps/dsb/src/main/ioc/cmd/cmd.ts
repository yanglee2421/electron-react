import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import { hydrateSubject } from "#main/utils/hydrate-subject";
import addon, { WindowsMessages } from "@yanglee2421/union-addon";
import { BrowserWindow, powerSaveBlocker } from "electron";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  catchError,
  concat,
  concatMap,
  distinctUntilChanged,
  EMPTY,
  filter,
  interval,
  map,
  race,
  startWith,
  switchMap,
  take,
  takeWhile,
  tap,
  timeout,
  using,
} from "rxjs";
import { z } from "zod";
import type { AppCradle } from "../types";

const findWork$ = interval(1000).pipe(
  map(() => addon.FindWindowW(null, "车轴检测 . 现车轮")),
  filter((handle) => addon.IsWindow(handle)),
  take(1),
  tap((handle) => {
    addon.SendMouseMove(handle, 1670, 508);
  }),
);

const findOptions$ = findWork$.pipe(
  switchMap(() => {
    return interval(1000).pipe(
      map(() => addon.FindWindowW(null, "操作选项")),
      filter((handle) => addon.IsWindow(handle)),
      take(1),
    );
  }),
);

const findStart$ = findOptions$.pipe(
  switchMap((handle) => {
    const controlID = 0x000000000000064f;

    return interval(1000).pipe(
      map(() => addon.GetDlgItem(handle, controlID)),
      filter((handle) => addon.IsWindow(handle)),
      take(1),
    );
  }),
);

const clickStart$ = findStart$.pipe(
  switchMap((handle) => {
    return interval(1000).pipe(
      tap(() => {
        addon.SendMessageTimeout(handle, WindowsMessages.BM_CLICK, 0, 0);
      }),
      map(() => addon.IsWindowEnabled(handle)),
      takeWhile((i) => i),
    );
  }),
);

const findTips$ = interval(1000 * 10).pipe(
  map(() => addon.FindWindowW(null, "探测结果")),
  filter((handle) => addon.IsWindow(handle)),
  take(1),
  tap((handle) => {
    addon.SendMessageTimeout(handle, WindowsMessages.WM_CLOSE, 0, 0);
  }),
);

const findResult$ = interval(1000 * 10).pipe(
  map(() => addon.FindWindowW(null, "探伤结果主窗口")),
  filter((handle) => addon.IsWindow(handle)),
  take(1),
  tap((handle) => {
    addon.SendMessageTimeout(handle, WindowsMessages.WM_CLOSE, 0, 0);
  }),
);

const defaultValue = () => {
  const value = [];

  for (let i = 1; i < 7; i++) {
    value.push({
      channel: `${i}-0`,
      db: 100,
      enabled: true,
      gates: [],
    });
    value.push({
      channel: `0-${i}`,
      db: 100,
      enabled: true,
      gates: [],
    });
  }

  return value;
};

const CHANNEL_INPUTS_STORAGE_KEY = "channel_inputs";
const channelInputSchema = z.object({
  open: z.boolean().default(false),
  interval: z.int().default(64),
  inputs: z
    .object({
      channel: z.string(),
      db: z.number(),
      enabled: z.boolean(),
      gates: z
        .object({
          width: z.number(),
          x: z.number(),
          y: z.number(),
        })
        .array()
        .default([]),
    })
    .array()
    .default(defaultValue()),
});
type CHANNEL_INPUTS = z.infer<typeof channelInputSchema>;

export class Cmd {
  private state$: BehaviorSubject<CHANNEL_INPUTS>;
  private subscriptions: Subscription[];
  private enabledAutoScript$ = new BehaviorSubject(false);

  constructor({ kv }: AppCradle) {
    ipcHandle("cmd/click-start", (_, value) => this.setAutoScript(value));

    const [state$, subscription1] = hydrateSubject(
      kv,
      CHANNEL_INPUTS_STORAGE_KEY,
      channelInputSchema,
    );
    this.state$ = state$;

    const subscription2 = this.state$
      .pipe(
        distinctUntilChanged(
          (prev, current) =>
            prev.open === current.open && prev.interval === current.interval,
        ),
        switchMap((state) => {
          const { open } = state;

          if (!open) {
            return EMPTY;
          }

          return using(
            () => {
              addon.TOFD_PORT_OpenDevice();
              addon.ITS_init();

              return {
                unsubscribe: () => {
                  addon.TOFD_PORT_CloseDevice();
                },
              };
            },
            () => {
              let index = 0;

              return interval(state.interval).pipe(
                tap(() => {
                  const inputs = this.state$
                    .getValue()
                    .inputs.filter((input) => input.enabled);
                  const input = inputs[index];
                  index = (index + 1) % inputs.length;
                  const [left, right] = input.channel.split("-").map((i) => +i);
                  const leftBuffer = Buffer.alloc(1024);
                  const rightBuffer = Buffer.alloc(1024);

                  addon.TOFD_PORT_SetFrequency(5000);
                  addon.ITS_SetDis(68000, 68000);
                  addon.ITS_SetCh(left, left, right, right);
                  addon.ITS_SetdB(left ? input.db : 0, right ? input.db : 0);
                  addon.ITS_Start(leftBuffer, rightBuffer);

                  let value: Uint8Array;

                  if (left) {
                    value = new Uint8Array(leftBuffer);
                  }

                  if (right) {
                    value = new Uint8Array(rightBuffer);
                  }

                  BrowserWindow.getAllWindows().forEach((win) => {
                    win.webContents.send(`buffer`, {
                      channel: input.channel,
                      buffer: value,
                    });
                  });
                }),
              );
            },
          );
        }),
      )
      .subscribe();

    const subscription3 = this.enabledAutoScript$
      .pipe(
        switchMap((enabled) => {
          if (!enabled) {
            return EMPTY;
          }

          return using(
            () => {
              const id = powerSaveBlocker.start("prevent-app-suspension");

              return {
                unsubscribe: () => {
                  powerSaveBlocker.stop(id);
                },
              };
            },
            () => interval(1000 * 60 * 3),
          ).pipe(
            startWith(0),
            concatMap(() => {
              return concat(
                clickStart$,
                race(findTips$, findResult$).pipe(timeout(1000 * 60 * 3)),
              ).pipe(
                catchError((error) => {
                  console.error(error);

                  return EMPTY;
                }),
              );
            }),
          );
        }),
      )
      .subscribe();

    this.subscriptions = [subscription1, subscription2, subscription3];
  }

  dispose() {
    this.state$.complete();
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    ipcRemoveHandle("cmd/click-start");
  }

  when() {
    return this.state$.asObservable();
  }

  setAutoScript(value: boolean) {
    this.enabledAutoScript$.next(value);
  }
}
