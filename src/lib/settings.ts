import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCustomPrinter,
  resolvePrinters,
  STOCK_PRINTERS,
  type Printer,
  type PrinterId,
  type PrinterOverride,
} from "./printers";
import {
  type FilamentProfile,
  type FilamentType,
  getAllDefaultProfiles,
  getDefaultProfile,
} from "./filaments";

const STORAGE_KEY = "printops-v1";

export interface AppSettings {
  selectedPrinterId: PrinterId;
  selectedFilamentType: FilamentType;
  profiles: Record<PrinterId, Record<FilamentType, FilamentProfile>>;
  setupProgress: Record<PrinterId, boolean[]>;
  /** User edits applied on top of stock or custom printer specs. */
  printerOverrides: Record<PrinterId, PrinterOverride>;
  /** Printers the user created. */
  customPrinters: Printer[];
}

const STEP_COUNTS: Record<string, number> = {
  "makergear-ultra-one": 10,
};
const DEFAULT_STEP_COUNT = 7;

function stepCountFor(printerId: PrinterId): number {
  return STEP_COUNTS[printerId] ?? DEFAULT_STEP_COUNT;
}

export function createDefaultSettings(): AppSettings {
  const profiles: AppSettings["profiles"] = {};
  const setupProgress: AppSettings["setupProgress"] = {};
  for (const printer of STOCK_PRINTERS) {
    profiles[printer.id] = getAllDefaultProfiles(printer.id);
    setupProgress[printer.id] = Array(stepCountFor(printer.id)).fill(false);
  }
  return {
    selectedPrinterId: "makergear-ultra-one",
    selectedFilamentType: "PLA",
    profiles,
    setupProgress,
    printerOverrides: {},
    customPrinters: [],
  };
}

/** Makes sure every known printer has a profile table and a progress array. */
function ensurePrinterData(settings: AppSettings): AppSettings {
  const ids = new Set<PrinterId>([
    ...STOCK_PRINTERS.map((p) => p.id),
    ...settings.customPrinters.map((p) => p.id),
    settings.selectedPrinterId,
  ]);
  let changed = false;
  const profiles = { ...settings.profiles };
  const setupProgress = { ...settings.setupProgress };
  for (const id of ids) {
    if (!profiles[id]) {
      profiles[id] = getAllDefaultProfiles(id);
      changed = true;
    }
    if (!setupProgress[id] || setupProgress[id]!.length !== stepCountFor(id)) {
      setupProgress[id] = Array(stepCountFor(id)).fill(false);
      changed = true;
    }
  }
  return changed ? { ...settings, profiles, setupProgress } : settings;
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return createDefaultSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSettings();
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const defaults = createDefaultSettings();
    return ensurePrinterData({
      ...defaults,
      ...parsed,
      profiles: { ...defaults.profiles, ...(parsed.profiles ?? {}) },
      setupProgress: { ...defaults.setupProgress, ...(parsed.setupProgress ?? {}) },
      printerOverrides: parsed.printerOverrides ?? {},
      customPrinters: parsed.customPrinters ?? [],
    });
  } catch {
    return createDefaultSettings();
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Safe profile lookup: never returns undefined, even for a brand-new printer. */
export function getProfile(
  settings: AppSettings,
  printerId: PrinterId,
  filamentType: FilamentType,
): FilamentProfile {
  return settings.profiles[printerId]?.[filamentType] ?? getDefaultProfile(printerId, filamentType);
}

export function getSetupProgress(settings: AppSettings, printerId: PrinterId): boolean[] {
  return settings.setupProgress[printerId] ?? Array(stepCountFor(printerId)).fill(false);
}

export function useAppSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(createDefaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettingsState(loadSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);

  const printers = useMemo(
    () => resolvePrinters(settings.printerOverrides, settings.customPrinters),
    [settings.printerOverrides, settings.customPrinters],
  );

  const setSettings = useCallback((updater: (prev: AppSettings) => AppSettings) => {
    setSettingsState((prev) => ensurePrinterData(updater(prev)));
  }, []);

  const setSelectedPrinterId = useCallback((id: PrinterId) => {
    setSettingsState((prev) => ensurePrinterData({ ...prev, selectedPrinterId: id }));
  }, []);

  const setSelectedFilamentType = useCallback((type: FilamentType) => {
    setSettingsState((prev) => ({ ...prev, selectedFilamentType: type }));
  }, []);

  const updateProfile = useCallback(
    (printerId: PrinterId, type: FilamentType, patch: Partial<FilamentProfile>) => {
      setSettingsState((prev) => {
        const base = prev.profiles[printerId] ?? getAllDefaultProfiles(printerId);
        return {
          ...prev,
          profiles: {
            ...prev.profiles,
            [printerId]: { ...base, [type]: { ...base[type], ...patch } },
          },
        };
      });
    },
    [],
  );

  const resetProfile = useCallback((printerId: PrinterId, type: FilamentType) => {
    setSettingsState((prev) => {
      const base = prev.profiles[printerId] ?? getAllDefaultProfiles(printerId);
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [printerId]: { ...base, [type]: getDefaultProfile(printerId, type) },
        },
      };
    });
  }, []);

  const resetAllProfilesForPrinter = useCallback((printerId: PrinterId) => {
    setSettingsState((prev) => ({
      ...prev,
      profiles: { ...prev.profiles, [printerId]: getAllDefaultProfiles(printerId) },
    }));
  }, []);

  const toggleSetupStep = useCallback((printerId: PrinterId, stepIndex: number) => {
    setSettingsState((prev) => {
      const progress = [...(prev.setupProgress[printerId] ?? Array(stepCountFor(printerId)).fill(false))];
      progress[stepIndex] = !progress[stepIndex];
      return { ...prev, setupProgress: { ...prev.setupProgress, [printerId]: progress } };
    });
  }, []);

  const updatePrinter = useCallback((printerId: PrinterId, patch: PrinterOverride) => {
    setSettingsState((prev) => ({
      ...prev,
      printerOverrides: {
        ...prev.printerOverrides,
        [printerId]: { ...(prev.printerOverrides[printerId] ?? {}), ...patch },
      },
    }));
  }, []);

  const resetPrinter = useCallback((printerId: PrinterId) => {
    setSettingsState((prev) => {
      const next = { ...prev.printerOverrides };
      delete next[printerId];
      return { ...prev, printerOverrides: next };
    });
  }, []);

  const addCustomPrinter = useCallback((name: string): Printer => {
    const printer = createCustomPrinter(name);
    setSettingsState((prev) =>
      ensurePrinterData({ ...prev, customPrinters: [...prev.customPrinters, printer] }),
    );
    return printer;
  }, []);

  const deleteCustomPrinter = useCallback((printerId: PrinterId) => {
    setSettingsState((prev) => {
      const customPrinters = prev.customPrinters.filter((p) => p.id !== printerId);
      const overrides = { ...prev.printerOverrides };
      delete overrides[printerId];
      const profiles = { ...prev.profiles };
      delete profiles[printerId];
      const setupProgress = { ...prev.setupProgress };
      delete setupProgress[printerId];
      const selectedPrinterId =
        prev.selectedPrinterId === printerId ? STOCK_PRINTERS[0]!.id : prev.selectedPrinterId;
      return ensurePrinterData({
        ...prev,
        customPrinters,
        printerOverrides: overrides,
        profiles,
        setupProgress,
        selectedPrinterId,
      });
    });
  }, []);

  /** Applies printer edits pulled down from the user's account. */
  const applyRemotePrinterState = useCallback(
    (overrides: Record<PrinterId, PrinterOverride>, customPrinters: Printer[]) => {
      setSettingsState((prev) =>
        ensurePrinterData({
          ...prev,
          printerOverrides: { ...overrides, ...prev.printerOverrides },
          customPrinters: [
            ...customPrinters.filter((p) => !prev.customPrinters.some((c) => c.id === p.id)),
            ...prev.customPrinters,
          ],
        }),
      );
    },
    [],
  );

  return {
    settings,
    hydrated,
    printers,
    setSettings,
    setSelectedPrinterId,
    setSelectedFilamentType,
    updateProfile,
    resetProfile,
    resetAllProfilesForPrinter,
    toggleSetupStep,
    updatePrinter,
    resetPrinter,
    addCustomPrinter,
    deleteCustomPrinter,
    applyRemotePrinterState,
  };
}
