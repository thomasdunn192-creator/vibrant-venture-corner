import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const overrideSchema = z.record(z.string(), z.unknown());

const rowSchema = z.object({
  printerId: z.string().min(1).max(80),
  isCustom: z.boolean(),
  overrides: overrideSchema,
});

export interface RemotePrinterRow {
  printerId: string;
  isCustom: boolean;
  overrides: Record<string, unknown>;
}

/** Reads the signed-in user's printer edits and custom printers. */
export const fetchPrinterProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RemotePrinterRow[]> => {
    const { data, error } = await context.supabase
      .from("printer_profiles")
      .select("printer_id, is_custom, overrides");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      printerId: row.printer_id,
      isCustom: row.is_custom,
      overrides: (row.overrides ?? {}) as Record<string, unknown>,
    }));
  });

/** Saves printer edits and custom printers to the user's account. */
export const pushPrinterProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ rows: z.array(rowSchema).max(100) }).parse(data))
  .handler(async ({ data, context }) => {
    if (data.rows.length === 0) return { saved: 0 };
    const rows = data.rows.map((row) => ({
      user_id: context.userId,
      printer_id: row.printerId,
      is_custom: row.isCustom,
      overrides: row.overrides,
    }));
    const { error } = await context.supabase
      .from("printer_profiles")
      .upsert(rows, { onConflict: "user_id,printer_id" });
    if (error) throw new Error(error.message);
    return { saved: rows.length };
  });

/** Removes a printer row from the user's account. */
export const deletePrinterProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ printerId: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("printer_profiles")
      .delete()
      .eq("printer_id", data.printerId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
