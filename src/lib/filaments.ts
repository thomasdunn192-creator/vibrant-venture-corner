import type { PrinterId } from "./printers";

export const FILAMENT_TYPES = [
  "PLA",
  "PETG",
  "ABS",
  "ASA",
  "TPU",
  "Nylon",
] as const;

export type FilamentType = (typeof FILAMENT_TYPES)[number];

export interface NumberSetting {
  default: number;
  current: number;
}

export interface OptionalNumberSetting extends NumberSetting {
  applicable: boolean;
}

export interface FilamentProfile {
  printerId: PrinterId;
  filamentType: FilamentType;
  nozzleTempC: NumberSetting;
  bedTempC: NumberSetting;
  printSpeedMmS: NumberSetting;
  fanSpeedPercent: NumberSetting;
  retractionDistanceMm: NumberSetting;
  retractionSpeedMmS: NumberSetting;
  chamberTempC: OptionalNumberSetting;
  notes: string;
}

export function createDefaultProfile(
  printerId: PrinterId,
  filamentType: FilamentType,
  values: {
    nozzleTempC: number;
    bedTempC: number;
    printSpeedMmS: number;
    fanSpeedPercent: number;
    retractionDistanceMm: number;
    retractionSpeedMmS: number;
    chamberTempC?: number;
  },
): FilamentProfile {
  return {
    printerId,
    filamentType,
    nozzleTempC: { default: values.nozzleTempC, current: values.nozzleTempC },
    bedTempC: { default: values.bedTempC, current: values.bedTempC },
    printSpeedMmS: { default: values.printSpeedMmS, current: values.printSpeedMmS },
    fanSpeedPercent: { default: values.fanSpeedPercent, current: values.fanSpeedPercent },
    retractionDistanceMm: { default: values.retractionDistanceMm, current: values.retractionDistanceMm },
    retractionSpeedMmS: { default: values.retractionSpeedMmS, current: values.retractionSpeedMmS },
    chamberTempC: {
      default: values.chamberTempC ?? 0,
      current: values.chamberTempC ?? 0,
      applicable: values.chamberTempC !== undefined,
    },
    notes: "",
  };
}

export const DEFAULT_PROFILES: Record<PrinterId, Record<FilamentType, FilamentProfile>> = {
  "makergear-ultra-one": {
    PLA: createDefaultProfile("makergear-ultra-one", "PLA", {
      nozzleTempC: 205,
      bedTempC: 60,
      printSpeedMmS: 60,
      fanSpeedPercent: 100,
      retractionDistanceMm: 0.6,
      retractionSpeedMmS: 35,
    }),
    PETG: createDefaultProfile("makergear-ultra-one", "PETG", {
      nozzleTempC: 235,
      bedTempC: 80,
      printSpeedMmS: 45,
      fanSpeedPercent: 40,
      retractionDistanceMm: 0.8,
      retractionSpeedMmS: 30,
    }),
    ABS: createDefaultProfile("makergear-ultra-one", "ABS", {
      nozzleTempC: 245,
      bedTempC: 100,
      printSpeedMmS: 45,
      fanSpeedPercent: 10,
      retractionDistanceMm: 0.6,
      retractionSpeedMmS: 35,
    }),
    ASA: createDefaultProfile("makergear-ultra-one", "ASA", {
      nozzleTempC: 250,
      bedTempC: 100,
      printSpeedMmS: 45,
      fanSpeedPercent: 10,
      retractionDistanceMm: 0.6,
      retractionSpeedMmS: 35,
    }),
    TPU: createDefaultProfile("makergear-ultra-one", "TPU", {
      nozzleTempC: 225,
      bedTempC: 50,
      printSpeedMmS: 25,
      fanSpeedPercent: 30,
      retractionDistanceMm: 3.0,
      retractionSpeedMmS: 20,
    }),
    Nylon: createDefaultProfile("makergear-ultra-one", "Nylon", {
      nozzleTempC: 255,
      bedTempC: 80,
      printSpeedMmS: 40,
      fanSpeedPercent: 20,
      retractionDistanceMm: 0.8,
      retractionSpeedMmS: 30,
    }),
  },
  "bambu-p1s": {
    PLA: createDefaultProfile("bambu-p1s", "PLA", {
      nozzleTempC: 220,
      bedTempC: 55,
      printSpeedMmS: 250,
      fanSpeedPercent: 100,
      retractionDistanceMm: 0.4,
      retractionSpeedMmS: 40,
    }),
    PETG: createDefaultProfile("bambu-p1s", "PETG", {
      nozzleTempC: 260,
      bedTempC: 70,
      printSpeedMmS: 150,
      fanSpeedPercent: 30,
      retractionDistanceMm: 0.5,
      retractionSpeedMmS: 35,
    }),
    ABS: createDefaultProfile("bambu-p1s", "ABS", {
      nozzleTempC: 260,
      bedTempC: 90,
      printSpeedMmS: 150,
      fanSpeedPercent: 20,
      retractionDistanceMm: 0.4,
      retractionSpeedMmS: 40,
    }),
    ASA: createDefaultProfile("bambu-p1s", "ASA", {
      nozzleTempC: 260,
      bedTempC: 90,
      printSpeedMmS: 150,
      fanSpeedPercent: 20,
      retractionDistanceMm: 0.4,
      retractionSpeedMmS: 40,
    }),
    TPU: createDefaultProfile("bambu-p1s", "TPU", {
      nozzleTempC: 230,
      bedTempC: 35,
      printSpeedMmS: 50,
      fanSpeedPercent: 40,
      retractionDistanceMm: 1.0,
      retractionSpeedMmS: 25,
    }),
    Nylon: createDefaultProfile("bambu-p1s", "Nylon", {
      nozzleTempC: 270,
      bedTempC: 70,
      printSpeedMmS: 100,
      fanSpeedPercent: 20,
      retractionDistanceMm: 0.5,
      retractionSpeedMmS: 35,
    }),
  },
  "prusa-core-one": {
    PLA: createDefaultProfile("prusa-core-one", "PLA", {
      nozzleTempC: 210,
      bedTempC: 60,
      printSpeedMmS: 200,
      fanSpeedPercent: 100,
      retractionDistanceMm: 0.5,
      retractionSpeedMmS: 40,
      chamberTempC: 0,
    }),
    PETG: createDefaultProfile("prusa-core-one", "PETG", {
      nozzleTempC: 240,
      bedTempC: 80,
      printSpeedMmS: 150,
      fanSpeedPercent: 40,
      retractionDistanceMm: 0.6,
      retractionSpeedMmS: 35,
      chamberTempC: 0,
    }),
    ABS: createDefaultProfile("prusa-core-one", "ABS", {
      nozzleTempC: 255,
      bedTempC: 100,
      printSpeedMmS: 150,
      fanSpeedPercent: 20,
      retractionDistanceMm: 0.5,
      retractionSpeedMmS: 40,
      chamberTempC: 45,
    }),
    ASA: createDefaultProfile("prusa-core-one", "ASA", {
      nozzleTempC: 260,
      bedTempC: 100,
      printSpeedMmS: 150,
      fanSpeedPercent: 20,
      retractionDistanceMm: 0.5,
      retractionSpeedMmS: 40,
      chamberTempC: 45,
    }),
    TPU: createDefaultProfile("prusa-core-one", "TPU", {
      nozzleTempC: 230,
      bedTempC: 50,
      printSpeedMmS: 45,
      fanSpeedPercent: 30,
      retractionDistanceMm: 1.5,
      retractionSpeedMmS: 25,
      chamberTempC: 0,
    }),
    Nylon: createDefaultProfile("prusa-core-one", "Nylon", {
      nozzleTempC: 270,
      bedTempC: 80,
      printSpeedMmS: 100,
      fanSpeedPercent: 20,
      retractionDistanceMm: 0.6,
      retractionSpeedMmS: 35,
      chamberTempC: 45,
    }),
  },
  "prusa-mk4s": {
    PLA: createDefaultProfile("prusa-mk4s", "PLA", {
      nozzleTempC: 210,
      bedTempC: 60,
      printSpeedMmS: 200,
      fanSpeedPercent: 100,
      retractionDistanceMm: 0.5,
      retractionSpeedMmS: 40,
    }),
    PETG: createDefaultProfile("prusa-mk4s", "PETG", {
      nozzleTempC: 240,
      bedTempC: 80,
      printSpeedMmS: 150,
      fanSpeedPercent: 40,
      retractionDistanceMm: 0.6,
      retractionSpeedMmS: 35,
    }),
    ABS: createDefaultProfile("prusa-mk4s", "ABS", {
      nozzleTempC: 255,
      bedTempC: 100,
      printSpeedMmS: 120,
      fanSpeedPercent: 20,
      retractionDistanceMm: 0.5,
      retractionSpeedMmS: 40,
    }),
    ASA: createDefaultProfile("prusa-mk4s", "ASA", {
      nozzleTempC: 260,
      bedTempC: 100,
      printSpeedMmS: 120,
      fanSpeedPercent: 20,
      retractionDistanceMm: 0.5,
      retractionSpeedMmS: 40,
    }),
    TPU: createDefaultProfile("prusa-mk4s", "TPU", {
      nozzleTempC: 230,
      bedTempC: 50,
      printSpeedMmS: 40,
      fanSpeedPercent: 30,
      retractionDistanceMm: 1.5,
      retractionSpeedMmS: 25,
    }),
    Nylon: createDefaultProfile("prusa-mk4s", "Nylon", {
      nozzleTempC: 270,
      bedTempC: 80,
      printSpeedMmS: 80,
      fanSpeedPercent: 20,
      retractionDistanceMm: 0.6,
      retractionSpeedMmS: 35,
    }),
  },
  "creality-ender-3": {
    PLA: createDefaultProfile("creality-ender-3", "PLA", {
      nozzleTempC: 200,
      bedTempC: 55,
      printSpeedMmS: 50,
      fanSpeedPercent: 100,
      retractionDistanceMm: 5.0,
      retractionSpeedMmS: 45,
    }),
    PETG: createDefaultProfile("creality-ender-3", "PETG", {
      nozzleTempC: 230,
      bedTempC: 75,
      printSpeedMmS: 40,
      fanSpeedPercent: 30,
      retractionDistanceMm: 5.5,
      retractionSpeedMmS: 40,
    }),
    ABS: createDefaultProfile("creality-ender-3", "ABS", {
      nozzleTempC: 240,
      bedTempC: 100,
      printSpeedMmS: 40,
      fanSpeedPercent: 10,
      retractionDistanceMm: 5.0,
      retractionSpeedMmS: 45,
    }),
    ASA: createDefaultProfile("creality-ender-3", "ASA", {
      nozzleTempC: 245,
      bedTempC: 100,
      printSpeedMmS: 40,
      fanSpeedPercent: 10,
      retractionDistanceMm: 5.0,
      retractionSpeedMmS: 45,
    }),
    TPU: createDefaultProfile("creality-ender-3", "TPU", {
      nozzleTempC: 220,
      bedTempC: 45,
      printSpeedMmS: 20,
      fanSpeedPercent: 20,
      retractionDistanceMm: 2.0,
      retractionSpeedMmS: 20,
    }),
    Nylon: createDefaultProfile("creality-ender-3", "Nylon", {
      nozzleTempC: 250,
      bedTempC: 70,
      printSpeedMmS: 30,
      fanSpeedPercent: 10,
      retractionDistanceMm: 5.5,
      retractionSpeedMmS: 40,
    }),
  },
  "creality-ender-5": {
    PLA: createDefaultProfile("creality-ender-5", "PLA", {
      nozzleTempC: 200,
      bedTempC: 55,
      printSpeedMmS: 50,
      fanSpeedPercent: 100,
      retractionDistanceMm: 5.0,
      retractionSpeedMmS: 45,
    }),
    PETG: createDefaultProfile("creality-ender-5", "PETG", {
      nozzleTempC: 230,
      bedTempC: 75,
      printSpeedMmS: 40,
      fanSpeedPercent: 30,
      retractionDistanceMm: 5.5,
      retractionSpeedMmS: 40,
    }),
    ABS: createDefaultProfile("creality-ender-5", "ABS", {
      nozzleTempC: 240,
      bedTempC: 100,
      printSpeedMmS: 40,
      fanSpeedPercent: 10,
      retractionDistanceMm: 5.0,
      retractionSpeedMmS: 45,
    }),
    ASA: createDefaultProfile("creality-ender-5", "ASA", {
      nozzleTempC: 245,
      bedTempC: 100,
      printSpeedMmS: 40,
      fanSpeedPercent: 10,
      retractionDistanceMm: 5.0,
      retractionSpeedMmS: 45,
    }),
    TPU: createDefaultProfile("creality-ender-5", "TPU", {
      nozzleTempC: 220,
      bedTempC: 45,
      printSpeedMmS: 20,
      fanSpeedPercent: 20,
      retractionDistanceMm: 2.0,
      retractionSpeedMmS: 20,
    }),
    Nylon: createDefaultProfile("creality-ender-5", "Nylon", {
      nozzleTempC: 250,
      bedTempC: 70,
      printSpeedMmS: 30,
      fanSpeedPercent: 10,
      retractionDistanceMm: 5.5,
      retractionSpeedMmS: 40,
    }),
  },
};

export function getDefaultProfile(
  printerId: PrinterId,
  filamentType: FilamentType,
): FilamentProfile {
  const profile = DEFAULT_PROFILES[printerId]?.[filamentType];
  if (!profile) throw new Error(`No default profile for ${printerId} + ${filamentType}`);
  return structuredClone(profile);
}

export function getAllDefaultProfiles(printerId: PrinterId): Record<FilamentType, FilamentProfile> {
  const profiles = DEFAULT_PROFILES[printerId];
  if (!profiles) throw new Error(`No default profiles for ${printerId}`);
  return structuredClone(profiles);
}

export function cloneProfile(profile: FilamentProfile): FilamentProfile {
  return structuredClone(profile);
}

export function isModified(profile: FilamentProfile): boolean {
  return (
    profile.nozzleTempC.current !== profile.nozzleTempC.default ||
    profile.bedTempC.current !== profile.bedTempC.default ||
    profile.printSpeedMmS.current !== profile.printSpeedMmS.default ||
    profile.fanSpeedPercent.current !== profile.fanSpeedPercent.default ||
    profile.retractionDistanceMm.current !== profile.retractionDistanceMm.default ||
    profile.retractionSpeedMmS.current !== profile.retractionSpeedMmS.default ||
    (profile.chamberTempC.applicable && profile.chamberTempC.current !== profile.chamberTempC.default) ||
    profile.notes.trim().length > 0
  );
}

export function resetProfileToDefaults(profile: FilamentProfile): FilamentProfile {
  const reset = cloneProfile(profile);
  reset.nozzleTempC.current = reset.nozzleTempC.default;
  reset.bedTempC.current = reset.bedTempC.default;
  reset.printSpeedMmS.current = reset.printSpeedMmS.default;
  reset.fanSpeedPercent.current = reset.fanSpeedPercent.default;
  reset.retractionDistanceMm.current = reset.retractionDistanceMm.default;
  reset.retractionSpeedMmS.current = reset.retractionSpeedMmS.default;
  reset.chamberTempC.current = reset.chamberTempC.default;
  reset.notes = "";
  return reset;
}
