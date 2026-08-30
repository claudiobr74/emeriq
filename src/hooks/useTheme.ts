"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "emeriq-theme";
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as ThemePreference) || "system";
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(pref: ThemePreference): "light" | "dark" {
  return pref === "dark" || (pref === "system" && systemPrefersDark())
    ? "dark"
    : "light";
}

function applyTheme(pref: ThemePreference) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolve(pref) === "dark");
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    media.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
  };
}

export function useTheme() {
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    () => "system" as ThemePreference,
  );
  const resolved = useSyncExternalStore(
    subscribe,
    () => resolve(readPreference()),
    () => "light" as "light" | "dark",
  );

  const setTheme = useCallback((pref: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, pref);
    applyTheme(pref);
    listeners.forEach((listener) => listener());
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  return { preference, resolved, setTheme, toggle };
}
