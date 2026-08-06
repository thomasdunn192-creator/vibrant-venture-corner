import printerMakerGear from "@/assets/printer-makergear.png";
import printerBambu from "@/assets/printer-bambu.png";
import printerPrusaCore from "@/assets/printer-prusa-core.png";
import printerPrusaMk4 from "@/assets/printer-prusa-mk4.png";
import printerEnder3 from "@/assets/printer-ender3.png";
import printerEnder5 from "@/assets/printer-ender5.png";

/** Printer ids are open-ended: the six stock ids plus any user-created printer. */
export type PrinterId = string;

export type StockPrinterId =
  | "makergear-ultra-one"
  | "bambu-p1s"
  | "prusa-core-one"
  | "prusa-mk4s"
  | "creality-ender-3"
  | "creality-ender-5";

export interface Printer {
  id: PrinterId;
  name: string;
  shortName: string;
  image: string;
  buildVolume: string;
  nozzleDiameterDefault: number;
  maxNozzleTemp: number;
  maxBedTemp: number;
  hasEnclosure: boolean;
  hasHeatedChamber: boolean;
  extruderType: "direct" | "bowden";
  flagship: boolean;
  /** True for printers the user added themselves. */
  custom?: boolean;
}

/** Fields the user is allowed to edit on a printer profile. */
export type PrinterOverride = Partial<
  Pick<
    Printer,
    | "name"
    | "shortName"
    | "buildVolume"
    | "nozzleDiameterDefault"
    | "maxNozzleTemp"
    | "maxBedTemp"
    | "hasEnclosure"
    | "hasHeatedChamber"
    | "extruderType"
  >
>;

export const STOCK_PRINTERS: Printer[] = [
  {
    id: "makergear-ultra-one",
    name: "MakerGear Ultra One",
    shortName: "Ultra One",
    image: printerMakerGear,
    buildVolume: "406 x 356 x 330 mm",
    nozzleDiameterDefault: 0.4,
    maxNozzleTemp: 300,
    maxBedTemp: 140,
    hasEnclosure: true,
    hasHeatedChamber: false,
    extruderType: "direct",
    flagship: true,
  },
  {
    id: "bambu-p1s",
    name: "Bambu Lab P1S",
    shortName: "P1S",
    image: printerBambu,
    buildVolume: "256 x 256 x 256 mm",
    nozzleDiameterDefault: 0.4,
    maxNozzleTemp: 300,
    maxBedTemp: 110,
    hasEnclosure: true,
    hasHeatedChamber: false,
    extruderType: "direct",
    flagship: false,
  },
  {
    id: "prusa-core-one",
    name: "Prusa Core One",
    shortName: "Core One",
    image: printerPrusaCore,
    buildVolume: "250 x 220 x 270 mm",
    nozzleDiameterDefault: 0.4,
    maxNozzleTemp: 290,
    maxBedTemp: 120,
    hasEnclosure: true,
    hasHeatedChamber: true,
    extruderType: "direct",
    flagship: false,
  },
  {
    id: "prusa-mk4s",
    name: "Prusa MK4S",
    shortName: "MK4S",
    image: printerPrusaMk4,
    buildVolume: "250 x 210 x 220 mm",
    nozzleDiameterDefault: 0.4,
    maxNozzleTemp: 290,
    maxBedTemp: 120,
    hasEnclosure: false,
    hasHeatedChamber: false,
    extruderType: "direct",
    flagship: false,
  },
  {
    id: "creality-ender-3",
    name: "Creality Ender 3",
    shortName: "Ender 3",
    image: printerEnder3,
    buildVolume: "220 x 220 x 250 mm",
    nozzleDiameterDefault: 0.4,
    maxNozzleTemp: 260,
    maxBedTemp: 110,
    hasEnclosure: false,
    hasHeatedChamber: false,
    extruderType: "bowden",
    flagship: false,
  },
  {
    id: "creality-ender-5",
    name: "Creality Ender 5",
    shortName: "Ender 5",
    image: printerEnder5,
    buildVolume: "350 x 350 x 400 mm",
    nozzleDiameterDefault: 0.4,
    maxNozzleTemp: 260,
    maxBedTemp: 135,
    hasEnclosure: false,
    hasHeatedChamber: false,
    extruderType: "bowden",
    flagship: false,
  },
];

export const DEFAULT_PRINTER_ID: PrinterId = "makergear-ultra-one";

/** Legacy alias: the untouched stock printer list. */
export const PRINTERS: Printer[] = STOCK_PRINTERS;

export const GENERIC_PRINTER_IMAGE = printerPrusaMk4;

export function createCustomPrinter(name: string): Printer {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return {
    id: `custom-${slug || "printer"}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    shortName: name.length > 14 ? name.slice(0, 14) : name,
    image: GENERIC_PRINTER_IMAGE,
    buildVolume: "220 x 220 x 250 mm",
    nozzleDiameterDefault: 0.4,
    maxNozzleTemp: 260,
    maxBedTemp: 110,
    hasEnclosure: false,
    hasHeatedChamber: false,
    extruderType: "direct",
    flagship: false,
    custom: true,
  };
}

/** Merges stock printers with user edits and user-created printers. */
export function resolvePrinters(
  overrides: Record<string, PrinterOverride> = {},
  customPrinters: Printer[] = [],
): Printer[] {
  const stock = STOCK_PRINTERS.map((printer) => ({
    ...printer,
    ...(overrides[printer.id] ?? {}),
  }));
  const custom = customPrinters.map((printer) => ({
    ...printer,
    ...(overrides[printer.id] ?? {}),
    image: printer.image || GENERIC_PRINTER_IMAGE,
    custom: true,
  }));
  return [...stock, ...custom];
}

export function isStockPrinter(id: PrinterId): boolean {
  return STOCK_PRINTERS.some((p) => p.id === id);
}

export function getStockPrinter(id: PrinterId): Printer | undefined {
  return STOCK_PRINTERS.find((p) => p.id === id);
}

/**
 * Looks a printer up. Pass the resolved list (stock + edits + custom) when
 * available; falls back to the stock list, then to a safe placeholder so a
 * stale selection can never crash the app.
 */
export function getPrinterById(id: PrinterId, printers?: Printer[]): Printer {
  const list = printers ?? STOCK_PRINTERS;
  const printer = list.find((p) => p.id === id) ?? STOCK_PRINTERS.find((p) => p.id === id);
  if (printer) return printer;
  return { ...createCustomPrinter("Unknown printer"), id };
}

export function isOverridden(printer: Printer, overrides: Record<string, PrinterOverride>): boolean {
  const o = overrides[printer.id];
  if (!o) return false;
  return Object.keys(o).length > 0;
}

