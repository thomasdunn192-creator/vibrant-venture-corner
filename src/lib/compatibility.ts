import { getPrinterById, type PrinterId } from "./printers";
import type { FilamentProfile, FilamentType } from "./filaments";

export interface CapabilityWarning {
  level: "warning" | "danger";
  message: string;
}

const HIGH_TEMP_ENCLOSURE_MATERIALS: FilamentType[] = ["ABS", "ASA", "Nylon"];

/**
 * Compares a filament's recommended defaults against the printer's rated
 * limits and enclosure capabilities.
 */
export function getFilamentCapabilityWarnings(
  printerId: PrinterId,
  filamentType: FilamentType,
  profile: FilamentProfile,
): CapabilityWarning[] {
  const printer = getPrinterById(printerId);
  const warnings: CapabilityWarning[] = [];

  if (profile.nozzleTempC.default > printer.maxNozzleTemp) {
    warnings.push({
      level: "danger",
      message: `${filamentType} typically needs ${profile.nozzleTempC.default}°C at the nozzle, above the ${printer.shortName}'s rated ${printer.maxNozzleTemp}°C maximum. Running past the hotend rating can damage the heater, thermistor, or wiring.`,
    });
  }

  if (profile.bedTempC.default > printer.maxBedTemp) {
    warnings.push({
      level: "danger",
      message: `${filamentType} typically needs a ${profile.bedTempC.default}°C bed, above the ${printer.shortName}'s rated ${printer.maxBedTemp}°C maximum. Expect adhesion problems and possible bed damage.`,
    });
  }

  if (
    HIGH_TEMP_ENCLOSURE_MATERIALS.includes(filamentType) &&
    !printer.hasEnclosure &&
    !printer.hasHeatedChamber
  ) {
    warnings.push({
      level: "warning",
      message: `${filamentType} warps and cracks badly on open-frame printers. The ${printer.shortName} has no enclosure — add one, or choose PLA or PETG instead.`,
    });
  }

  return warnings;
}

/** Soft warning when the user manually pushes a temperature past the rating. */
export function getTempOverrideWarning(
  printerId: PrinterId,
  field: "nozzle" | "bed",
  value: number,
): string | null {
  const printer = getPrinterById(printerId);
  const max = field === "nozzle" ? printer.maxNozzleTemp : printer.maxBedTemp;
  if (!Number.isFinite(value) || value <= max) return null;
  return `${value}°C exceeds the ${printer.shortName}'s rated ${max}°C ${field} maximum.`;
}
