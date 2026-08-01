import { useCallback, useEffect, useState } from "react";
import type { PrinterId } from "./printers";
import { type FilamentProfile, type FilamentType, getAllDefaultProfiles, getDefaultProfile } from "./filaments";

const STORAGE_KEY = "printops-v1";

export interface AppSettings {
  selectedPrinterId: PrinterId;
  selectedFilamentType: FilamentType;
  profiles: Record<PrinterId, Record<FilamentType, FilamentProfile>>;
  setupProgress: Record<PrinterId, boolean[]>;
}

export function createDefaultSettings(): AppSettings {
  return {
    selectedPrinterId: "makergear-ultra-one",
    selectedFilamentType: "PLA",
    profiles: {
      "makergear-ultra-one": getAllDefaultProfiles("makergear-ultra-one"),
      "bambu-p1s": getAllDefaultProfiles("bambu-p1s"),
      "prusa-core-one": getAllDefaultProfiles("prusa-core-one"),
      "prusa-mk4s": getAllDefaultProfiles("prusa-mk4s"),
      "creality-ender-3": getAllDefaultProfiles("creality-ender-3"),
      "creality-ender-5": getAllDefaultProfiles("creality-ender-5"),
    },
    setupProgress: {
      "makergear-ultra-one": Array(10).fill(false),
      "bambu-p1s": Array(7).fill(false),
      "prusa-core-one": Array(7).fill(false),
      "prusa-mk4s": Array(7).fill(false),
      "creality-ender-3": Array(7).fill(false),
      "creality-ender-5": Array(7).fill(false),
    },
  };
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return createDefaultSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSettings();
    const parsed = JSON.parse(raw) as AppSettings;
    // Merge with defaults in case new fields were added
    const defaults = createDefaultSettings();
    return {
      ...defaults,
      ...parsed,
      profiles: { ...defaults.profiles, ...parsed.profiles },
      setupProgress: { ...defaults.setupProgress, ...parsed.setupProgress },
    };
  } catch {
    return createDefaultSettings();
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
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

  const setSettings = useCallback((updater: (prev: AppSettings) => AppSettings) => {
    setSettingsState((prev) => updater(prev));
  }, []);

  const setSelectedPrinterId = useCallback((id: PrinterId) => {
    setSettingsState((prev) => ({ ...prev, selectedPrinterId: id }));
  }, []);

  const setSelectedFilamentType = useCallback((type: FilamentType) => {
    setSettingsState((prev) => ({ ...prev, selectedFilamentType: type }));
  }, []);

  const updateProfile = useCallback((printerId: PrinterId, type: FilamentType, patch: Partial<FilamentProfile>) => {
    setSettingsState((prev) => {
      const next = { ...prev };
      next.profiles = { ...prev.profiles };
      next.profiles[printerId] = { ...prev.profiles[printerId] };
      next.profiles[printerId][type] = { ...prev.profiles[printerId][type], ...patch };
      return next;
    });
  }, []);

  const resetProfile = useCallback((printerId: PrinterId, type: FilamentType) => {
    setSettingsState((prev) => {
      const next = { ...prev };
      next.profiles = { ...prev.profiles };
      next.profiles[printerId] = { ...prev.profiles[printerId] };
      next.profiles[printerId][type] = getDefaultProfile(printerId, type);
      return next;
    });
  }, []);

  const resetAllProfilesForPrinter = useCallback((printerId: PrinterId) => {
    setSettingsState((prev) => {
      const next = { ...prev };
      next.profiles = { ...prev.profiles };
      next.profiles[printerId] = getAllDefaultProfiles(printerId);
      return next;
    });
  }, []);

  const toggleSetupStep = useCallback((printerId: PrinterId, stepIndex: number) => {
    setSettingsState((prev) => {
      const next = { ...prev };
      next.setupProgress = { ...prev.setupProgress };
      const progress = [...prev.setupProgress[printerId]];
      progress[stepIndex] = !progress[stepIndex];
      next.setupProgress[printerId] = progress;
      return next;
    });
  }, []);

  return {
    settings,
    hydrated,
    setSettings,
    setSelectedPrinterId,
    setSelectedFilamentType,
    updateProfile,
    resetProfile,
    resetAllProfilesForPrinter,
    toggleSetupStep,
  };
}
