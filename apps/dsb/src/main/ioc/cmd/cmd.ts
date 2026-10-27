import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import { hydrateSubject } from "#main/utils/hydrate-subject";
import cppAddon, { WindowsMessages } from "@yanglee2421/cpp-addon";
import addon from "@yanglee2421/union-addon";
import { BrowserWindow } from "electron";
import type { BehaviorSubject, Subscription } from "rxjs";
import {
  concat,
  concatMap,
  delay,
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
  timer,
  using,
} from "rxjs";
import { z } from "zod";
import type { AppCradle } from "../types";

const findOptions$ = interval(1000).pipe(
  tap(() => {
    const handle = cppAddon.findWindow(null, "车轴检测 . 现车轮");
    console.log("车轴检测 . 现车轮", handle);

    if (handle) {
      cppAddon.SendMouseMove(BigInt(handle), 1670, 508);
    }
  }),
  map(() => cppAddon.findWindow(null, "操作选项")),
  filter((handle) => !!handle),
  delay(100),
  tap((handle) => {
    console.log("操作选项", handle);

    cppAddon.enumChildWindows(handle, (childHandle) => {
      const controlId = cppAddon.getWindowLongPtrW(childHandle, -12);
      console.log("enumChildWindows", controlId);

      if (controlId !== 0x000000000000064fn) {
        return true;
      }

      setInterval(() => {
        const result = cppAddon.sendMessage(
          childHandle,
          WindowsMessages.BM_CLICK,
          0,
          0,
        );
        console.log(result);
      }, 1000);

      return false;
    });
  }),
  takeWhile((value) => !value),
);

const findTips$ = interval(1000 * 10).pipe(
  map(() => cppAddon.findWindow(null, "探测结果")),
  filter((handle) => !!handle),
  tap((handle) => {
    cppAddon.sendMessage(handle, WindowsMessages.WM_CLOSE, 0, 0);
  }),
  takeWhile((value) => !value),
);

const findResult$ = interval(1000 * 10).pipe(
  map(() => cppAddon.findWindow(null, "探伤结果主窗口")),
  filter((handle) => !!handle),
  tap((handle) => {
    cppAddon.sendMessage(handle, WindowsMessages.WM_CLOSE, 0, 0);
  }),
  takeWhile((value) => !value),
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

  constructor({ kv }: AppCradle) {
    ipcHandle("cmd/click-start", () => this.clickStart());

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

    this.subscriptions = [subscription1, subscription2];
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

  clickStart() {
    console.log("clickstart");

    interval(1000 * 60 * 4)
      .pipe(
        startWith(0),
        concatMap(() => {
          return concat(
            findOptions$,
            race(findTips$, findResult$, timer(1000 * 60 * 4)),
          );
        }),
        take(2),
      )
      .subscribe();
  }
}
