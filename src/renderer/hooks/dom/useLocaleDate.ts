import React from "react";

class AnimationFrameStore {
  #listeners: Set<() => void> = new Set();
  #animationFrameId: number | null = null;

  subscribe(listener: () => void) {
    this.#listeners.add(listener);
    this.play();

    return () => {
      this.unsubscribe(listener);
    };
  }
  unsubscribe(listener: () => void) {
    this.#listeners.delete(listener);

    if (this.#listeners.size === 0) {
      this.pause();
    }
  }
  play() {
    cancelAnimationFrame(this.#animationFrameId!);
    this.#animationFrameId = requestAnimationFrame(() => {
      this.play();

      this.#listeners.forEach((listener) => listener());
    });
  }
  pause() {
    cancelAnimationFrame(this.#animationFrameId!);
    this.#animationFrameId = null;
  }
}

const animationFrameStore = new AnimationFrameStore();

export const useLocaleTime = (locales?: Intl.LocalesArgument) => {
  return React.useSyncExternalStore(
    animationFrameStore.subscribe.bind(animationFrameStore),
    () => {
      return new Date().toLocaleTimeString(locales, {
        hour12: false,
      });
    },
  );
};

export const useLocaleDate = (locales?: Intl.LocalesArgument) => {
  return React.useSyncExternalStore(
    animationFrameStore.subscribe.bind(animationFrameStore),
    () => {
      return new Date().toLocaleDateString(locales, {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "numeric",
      });
    },
  );
};
