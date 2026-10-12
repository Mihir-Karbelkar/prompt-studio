"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed store usable from React (via `useValue`) and from
 * plain callbacks (via `get`). `useValue` returns `undefined` until hydrated.
 */
export function createLocalStore(storageKey: string) {
  const listeners = new Set<() => void>();

  const subscribe = (fn: () => void) => {
    listeners.add(fn);
    window.addEventListener("storage", fn);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", fn);
    };
  };

  const get = (): string | null => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };

  const set = (value: string | null) => {
    try {
      if (value) localStorage.setItem(storageKey, value);
      else localStorage.removeItem(storageKey);
    } catch {}
    listeners.forEach((fn) => fn());
  };

  const useValue = () =>
    useSyncExternalStore<string | null | undefined>(subscribe, get, () => undefined);

  return { get, set, useValue };
}
