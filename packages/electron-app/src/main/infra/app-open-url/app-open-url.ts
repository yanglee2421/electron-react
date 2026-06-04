import { last, shareReplay, Subject, takeUntil } from "rxjs";

interface OpenURLPayload {
  url: string;
}

export class AppOpenURL {
  private readonly cmd$ = new Subject<OpenURLPayload>();
  readonly url$ = this.cmd$.pipe(
    takeUntil(this.cmd$.pipe(last())),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  emit(url?: string) {
    if (!url) return;

    this.cmd$.next({ url });
  }
}
