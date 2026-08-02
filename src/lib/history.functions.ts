import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const entrySchema = z.object({
  localId: z.string().min(1).max(80),
  kind: z.enum(["symptom", "chat", "setting"]),
  title: z.string().min(1).max(200),
  printerId: z.string().max(80).nullable().optional(),
  filamentType: z.string().max(40).nullable().optional(),
  question: z.string().max(4000).nullable().optional(),
  answer: z.string().max(20000).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  outcome: z.enum(["open", "resolved", "unresolved", "testing"]),
  imagePaths: z.array(z.string().max(300)).max(6).default([]),
  occurredAt: z.string().min(1).max(40),
});

export type RemoteLogEntryInput = z.infer<typeof entrySchema>;

export interface RemoteLogEntry {
  localId: string;
  kind: "symptom" | "chat" | "setting";
  title: string;
  printerId: string | null;
  filamentType: string | null;
  question: string | null;
  answer: string | null;
  notes: string | null;
  outcome: "open" | "resolved" | "unresolved" | "testing";
  imagePaths: string[];
  occurredAt: string;
}

/** Reads every troubleshooting entry saved to the signed-in user's account. */
export const fetchLogEntries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RemoteLogEntry[]> => {
    const { data, error } = await context.supabase
      .from("troubleshooting_log")
      .select(
        "local_id, kind, title, printer_id, filament_type, question, answer, notes, outcome, image_paths, occurred_at",
      )
      .order("occurred_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      localId: row.local_id,
      kind: row.kind as RemoteLogEntry["kind"],
      title: row.title,
      printerId: row.printer_id,
      filamentType: row.filament_type,
      question: row.question,
      answer: row.answer,
      notes: row.notes,
      outcome: row.outcome as RemoteLogEntry["outcome"],
      imagePaths: Array.isArray(row.image_paths) ? (row.image_paths as string[]) : [],
      occurredAt: row.occurred_at,
    }));
  });

/** Saves (creates or updates) troubleshooting entries on the user's account. */
export const pushLogEntries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ entries: z.array(entrySchema).max(200) }).parse(data))
  .handler(async ({ data, context }) => {
    if (data.entries.length === 0) return { saved: 0 };
    const rows = data.entries.map((entry) => ({
      user_id: context.userId,
      local_id: entry.localId,
      kind: entry.kind,
      title: entry.title,
      printer_id: entry.printerId ?? null,
      filament_type: entry.filamentType ?? null,
      question: entry.question ?? null,
      answer: entry.answer ?? null,
      notes: entry.notes ?? null,
      outcome: entry.outcome,
      image_paths: entry.imagePaths,
      occurred_at: entry.occurredAt,
    }));
    const { error } = await context.supabase
      .from("troubleshooting_log")
      .upsert(rows, { onConflict: "user_id,local_id" });
    if (error) throw new Error(error.message);
    return { saved: rows.length };
  });

/** Removes one entry from the user's account. */
export const deleteLogEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ localId: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("troubleshooting_log")
      .delete()
      .eq("local_id", data.localId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
