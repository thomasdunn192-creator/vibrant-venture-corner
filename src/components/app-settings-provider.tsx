import { createContext, useContext, type ReactNode } from "react";
import { useAppSettings } from "@/lib/settings";
import type { AppSettings } from "@/lib/settings";

const AppSettingsContext = createContext<ReturnType<typeof useAppSettings> | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const value = useAppSettings();
  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettingsContext() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettingsContext must be used within AppSettingsProvider");
  }
  return ctx;
}

export type { AppSettings };
