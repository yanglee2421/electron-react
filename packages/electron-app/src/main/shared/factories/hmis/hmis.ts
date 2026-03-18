import type { KV } from "../KV";

export interface Net {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

type ListenerFn<TStore> = (state: TStore, previous: TStore) => void;
type Parse<TStore> = (_: unknown) => TStore;

export abstract class HMIS<TStore> {
  private handles: Set<ListenerFn<TStore>> = new Set();
  private store: TStore;
  protected parse: Parse<TStore>;
  protected storageKey: string;
  protected kv: KV;

  constructor(parse: Parse<TStore>, storageKey: string, kv: KV) {
    this.parse = parse;
    this.store = Object.freeze(parse({}));
    this.storageKey = storageKey;
    this.kv = kv;

    this.kv.on((key) => {
      if (key === this.storageKey) {
        void this.hydrate();
      }
    });
  }

  getStore() {
    return this.store;
  }
  on(handle: ListenerFn<TStore>) {
    this.handles.add(handle);

    return () => {
      this.off(handle);
    };
  }
  off(handle: ListenerFn<TStore>) {
    this.handles.delete(handle);
  }
  emit(state: TStore, previous: TStore) {
    this.handles.forEach((handle) => handle(state, previous));
  }
  async hydrate() {
    const persistedValue = await this.kv.getItem(this.storageKey);

    if (!persistedValue) return;

    const previous = this.store;
    const data = JSON.parse(persistedValue);

    this.store = Object.freeze(this.parse(data.state));
    this.emit(this.store, previous);
  }
}
