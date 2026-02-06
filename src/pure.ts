import * as fs from "node:fs";
import { produce } from "immer";

type CallbackFn<TArgs extends unknown[], TReturn> = (...args: TArgs) => TReturn;

export class ProfileStore<TState> {
  #filePath: string;
  #parse: CallbackFn<[unknown], TState>;
  #listeners = new Set<CallbackFn<[TState, TState], void>>();

  constructor(parse: CallbackFn<[unknown], TState>, filePath: string) {
    this.#parse = parse;
    this.#filePath = filePath;
  }

  async getState() {
    try {
      const json = await fs.promises.readFile(this.#filePath, "utf-8");
      return this.#parse(JSON.parse(json));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      return this.#parse({});
    }
  }
  async setState(callback: CallbackFn<[TState], void>) {
    const previous = await this.getState();
    const next = produce(previous, callback);
    await fs.promises.writeFile(this.#filePath, JSON.stringify(next), "utf-8");

    this.#listeners.forEach((callbackFn) => {
      try {
        callbackFn(previous, next);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(error);
        }
      }
    });
  }
  subscribe(listener: CallbackFn<[TState, TState], void>) {
    this.#listeners.add(listener);

    return () => {
      this.unsubscribe(listener);
    };
  }
  unsubscribe(listener: CallbackFn<[TState, TState], void>) {
    this.#listeners.delete(listener);
  }
}
