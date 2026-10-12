import { CHANNEL_INPUTS_STORAGE_KEY } from "#shared/instances/constants";
import type { CHANNEL_INPUTS } from "#shared/instances/schema";
import { channelInputSchema } from "#shared/instances/schema";
import addon from "@yanglee2421/cpp-addon";
import dayjs from "dayjs";
import { BrowserWindow } from "electron";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  distinctUntilChanged,
  EMPTY,
  filter,
  interval,
  map,
  switchMap,
  tap,
  using,
} from "rxjs";
import type { AppCradle } from "../types";
import type { AutoInputToVCParams } from "./types";

export class Cmd {
  readonly state$: BehaviorSubject<CHANNEL_INPUTS>;
  private subscriptions: Subscription[];

  constructor({ kv }: AppCradle) {
    const stateJSON = kv.getItem(CHANNEL_INPUTS_STORAGE_KEY);
    const data = stateJSON ? JSON.parse(stateJSON).state : {};
    const state = channelInputSchema.parse(data);
    this.state$ = new BehaviorSubject(state);

    const subscription1 = kv.events$
      .pipe(
        filter((e) => e.key === CHANNEL_INPUTS_STORAGE_KEY),
        map((e) => {
          switch (e.action) {
            case "set":
              return channelInputSchema.parse(
                e.value ? JSON.parse(e.value).state : {},
              );
            case "remove":
            case "clear":
              return channelInputSchema.parse({});
          }
        }),
      )
      .subscribe(this.state$);

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

                  let value: number[] = [];

                  if (left) {
                    value = [...leftBuffer];
                  }

                  if (right) {
                    value = [...rightBuffer];
                  }

                  BrowserWindow.getAllWindows().forEach((win) => {
                    win.webContents.send(`buffer:${input.channel}`, value);
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
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.state$.complete();
  }

  autoInputToVCNaive(data: AutoInputToVCParams) {
    return addon.autoInputToVC(
      data.zx,
      data.zh,
      data.czzzdw,
      data.sczzdw,
      data.mczzdw,
      dayjs(data.czzzrq).format("YYYYMM"),
      dayjs(data.sczzrq).format("YYYYMMDD"),
      dayjs(data.mczzrq).format("YYYYMMDD"),
      +data.ztx,
      +data.ytx,
    );
  }
  isRunAsAdmin() {
    return addon.isRunAsAdmin();
  }
}
