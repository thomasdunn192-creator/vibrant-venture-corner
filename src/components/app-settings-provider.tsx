import { createContext, useContext, type ReactNode } from "react";
import { useAppSettings } from "@/lib/settings";
import { usePrinterProfileSync } from "@/lib/printer-sync";
import type { AppSettings } from "@/lib/settings";

type AppSettingsValue = ReturnType<typeof useAppSettings> & {
  /** True when printer edits are being mirrored to a signed-in account. */
  accountSyncEnabled: boolean;
  forgetRemotePrinter: (printerId: string) => void;
};

const AppSettingsContext = createContext<AppSettingsValue | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const value = useAppSettings();
  const { signedIn, forgetRemotePrinter } = usePrinterProfileSync({
    hydrated: value.hydrated,
    printerOverrides: value.settings.printerOverrides,
    customPrinters: value.settings.customPrinters,
    applyRemotePrinterState: value.applyRemotePrinterState,
  });

  return (
    <AppSettingsContext.Provider
      value={{ ...value, accountSyncEnabled: signedIn, forgetRemotePrinter }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettingsContext() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettingsContext must be used within AppSettingsProvider");
  }
  return ctx;
}

export type { AppSettings };
