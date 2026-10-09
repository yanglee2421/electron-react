import addon from "@yanglee2421/cpp-addon";
import dayjs from "dayjs";
import { BrowserWindow } from "electron";
import type { Subscription } from "rxjs";
import { EMPTY, interval, map, Subject, switchMap, tap } from "rxjs";
import type { AutoInputToVCParams } from "./types";

export class Cmd {
  private readonly open$ = new Subject<boolean>();
  private subscription: Subscription;

  constructor() {
    this.subscription = this.open$
      .pipe(
        tap((open) => {
          if (open) {
            addon.TOFD_PORT_OpenDevice();
            addon.ITS_init();
            addon.TOFD_PORT_SetFrequency(5000);
            addon.ITS_SetCh(1, 1, 0, 0);
            addon.ITS_SetdB(900, 0);
            addon.ITS_SetDis(68000, 68000);
          } else {
            addon.TOFD_PORT_CloseDevice();
          }
        }),
        switchMap((open) => {
          if (!open) {
            return EMPTY;
          }

          return interval(64).pipe(
            map(() => this.itsStart().left),
            tap((value) => {
              BrowserWindow.getAllWindows().forEach((win) => {
                win.webContents.send("buffer", value);
              });
            }),
          );
        }),
      )
      .subscribe();
  }

  dispose() {
    this.subscription.unsubscribe();
    this.open$.complete();
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

  openDevice() {
    this.open$.next(true);
  }
  closeDevice() {
    this.open$.next(false);
  }
  itsInit() {
    return addon.ITS_init();
  }
  itsSetChannel() {
    return addon.ITS_SetCh(1, 1, 0, 0);
  }
  itsSetDB(left: number, right: number) {
    return addon.ITS_SetdB(left, right);
  }
  itsSetDis() {
    return addon.ITS_SetDis(68000, 68000);
  }
  itsStart() {
    const leftBuffer = Buffer.alloc(1024);
    const rightBuffer = Buffer.alloc(1024);

    addon.ITS_Start(leftBuffer, rightBuffer);

    return {
      left: [...leftBuffer],
      right: [...rightBuffer],
    };
  }
}
