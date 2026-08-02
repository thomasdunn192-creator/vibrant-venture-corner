import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import {
  deletePrinterProfile,
  fetchPrinterProfiles,
  pushPrinterProfiles,
  type PrinterOverrideDTO,
} from "./printer-sync.functions";
import { createCustomPrinter, type Printer, type PrinterOverride } from "./printers";

interface SyncArgs {
  hydrated: boolean;
  printerOverrides: Record<string, PrinterOverride>;
  customPrinters: Printer[];
  applyRemotePrinterState: (
    overrides: Record<string, PrinterOverride>,
    customPrinters: Printer[],
  ) => void;
}

/**
 * Mirrors printer edits and custom printers to the signed-in user's account.
 * Guests keep everything in the browser; nothing breaks when signed out.
 */
export function usePrinterProfileSync({
  hydrated,
  printerOverrides,
  customPrinters,
  applyRemotePrinterState,
}: SyncArgs) {
  const [signedIn, setSignedIn] = useState(false);
  const pull = useServerFn(fetchPrinterProfiles);
  const push = useServerFn(pushPrinterProfiles);
  const removeRow = useServerFn(deletePrinterProfile);
  const lastPushed = useRef<string | null>(null);
  const pulled = useRef(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!active) return;
      if (!session) pulled.current = false;
      setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Pull once per sign-in.
  useEffect(() => {
    if (!hydrated || !signedIn || pulled.current) return;
    pulled.current = true;
    void (async () => {
      try {
        const rows = await pull({});
        const overrides: Record<string, PrinterOverride> = {};
        const customs: Printer[] = [];
        for (const row of rows) {
          if (row.isCustom) {
            const base = createCustomPrinter(row.overrides.name ?? "Custom printer");
            const merged: Printer = { ...base };
            for (const [key, value] of Object.entries(row.overrides)) {
              if (value !== undefined) (merged as unknown as Record<string, unknown>)[key] = value;
            }
            merged.id = row.printerId;
            merged.custom = true;
            customs.push(merged);
          } else {
            overrides[row.printerId] = row.overrides as PrinterOverride;
          }
        }
        applyRemotePrinterState(overrides, customs);
      } catch {
        // account sync is best-effort
      }
    })();
  }, [hydrated, signedIn, pull, applyRemotePrinterState]);

  // Push whenever the local printer state changes.
  useEffect(() => {
    if (!hydrated || !signedIn) return;
    const rows = [
      ...Object.entries(printerOverrides)
        .filter(([, value]) => value && Object.keys(value).length > 0)
        .map(([printerId, value]) => ({
          printerId,
          isCustom: false,
          overrides: value as PrinterOverrideDTO,
        })),
      ...customPrinters.map((printer) => ({
        printerId: printer.id,
        isCustom: true,
        overrides: {
          name: printer.name,
          shortName: printer.shortName,
          buildVolume: printer.buildVolume,
          nozzleDiameterDefault: printer.nozzleDiameterDefault,
          maxNozzleTemp: printer.maxNozzleTemp,
          maxBedTemp: printer.maxBedTemp,
          hasEnclosure: printer.hasEnclosure,
          hasHeatedChamber: printer.hasHeatedChamber,
          extruderType: printer.extruderType,
        } satisfies PrinterOverrideDTO,
      })),
    ];
    const serialized = JSON.stringify(rows);
    if (serialized === lastPushed.current) return;
    lastPushed.current = serialized;
    if (rows.length === 0) return;
    void push({ data: { rows } }).catch(() => {
      // best-effort
    });
  }, [hydrated, signedIn, printerOverrides, customPrinters, push]);

  const forgetRemotePrinter = useCallback(
    (printerId: string) => {
      if (!signedIn) return;
      void removeRow({ data: { printerId } }).catch(() => {
        // best-effort
      });
    },
    [signedIn, removeRow],
  );

  return { signedIn, forgetRemotePrinter };
}
