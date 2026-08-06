import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const trackInputSchema = z.object({
  eventName: z.string().min(1).max(64),
  pagePath: z.string().max(256).optional(),
  printerId: z.string().max(64).optional(),
  filamentType: z.string().max(32).optional(),
  detail: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  visitorId: z.string().max(64).optional(),
});

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((data) => trackInputSchema.parse(data))
  .handler(async ({ data }) => {
    // Never trust a client-supplied user id: resolve it from the request session.
    const { getVerifiedUserId } = await import("./analytics.server");
    const verifiedUserId = await getVerifiedUserId();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("usage_events").insert({
      event_name: data.eventName,
      page_path: data.pagePath ?? null,
      printer_id: data.printerId ?? null,
      filament_type: data.filamentType ?? null,
      detail: data.detail ?? null,
      visitor_id: data.visitorId ?? null,
      user_id: verifiedUserId,
    });
    if (error) {
      console.error("trackEvent insert failed", error.message);
      return { ok: false as const };
    }
    return { ok: true as const };
  });

const metricsInputSchema = z.object({
  range: z.enum(["24h", "7d", "30d", "all"]),
});

export interface CountRow {
  label: string;
  count: number;
}

export interface RecentEvent {
  id: string;
  eventName: string;
  pagePath: string | null;
  printerId: string | null;
  filamentType: string | null;
  createdAt: string;
  signedIn: boolean;
}

export interface UsageMetrics {
  totalEvents: number;
  uniqueVisitors: number;
  signedInUsers: number;
  eventsPerDay: CountRow[];
  byEvent: CountRow[];
  byPage: CountRow[];
  byPrinter: CountRow[];
  byFilament: CountRow[];
  byTopic: CountRow[];
  byEditedField: CountRow[];
  chatMessages: number;
  resets: number;
  resetAlls: number;
  recent: RecentEvent[];
}

export const getUsageMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => metricsInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<UsageMetrics> => {
    // has_role now lives in the private schema (not exposed via the Data API),
    // so verify admin status by reading the caller's own role rows under RLS.
    const { data: roleRows, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .limit(1);
    if (roleError) throw new Error("Could not verify permissions.");
    if (!roleRows || roleRows.length === 0) throw new Error("Forbidden");

    const since = rangeStart(data.range);
    let query = context.supabase
      .from("usage_events")
      .select("id, event_name, page_path, printer_id, filament_type, detail, visitor_id, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10000);
    if (since) query = query.gte("created_at", since);

    const { data: rows, error } = await query;
    if (error) throw new Error("Could not load usage data.");

    const events = rows ?? [];
    const visitors = new Set<string>();
    const users = new Set<string>();
    const perDay = new Map<string, number>();
    const perEvent = new Map<string, number>();
    const perPage = new Map<string, number>();
    const perPrinter = new Map<string, number>();
    const perFilament = new Map<string, number>();
    const perTopic = new Map<string, number>();
    const perEditedField = new Map<string, number>();
    let chatMessages = 0;
    let resets = 0;
    let resetAlls = 0;

    for (const row of events) {
      if (row.visitor_id) visitors.add(row.visitor_id);
      if (row.user_id) users.add(row.user_id);
      bump(perDay, (row.created_at ?? "").slice(0, 10));
      bump(perEvent, row.event_name);
      if (row.event_name === "page_view" && row.page_path) bump(perPage, row.page_path);
      if (row.printer_id) bump(perPrinter, row.printer_id);
      if (row.filament_type) bump(perFilament, row.filament_type);
      if (row.event_name === "chat_message_sent") chatMessages += 1;
      if (row.event_name === "troubleshooting_topic_opened" || row.event_name === "ask_ai_pressed") {
        const detail = row.detail as { topic?: string } | null;
        if (detail?.topic) bump(perTopic, detail.topic);
      }
    }

    return {
      totalEvents: events.length,
      uniqueVisitors: visitors.size,
      signedInUsers: users.size,
      eventsPerDay: toRows(perDay).sort((a, b) => a.label.localeCompare(b.label)),
      byEvent: sortDesc(perEvent),
      byPage: sortDesc(perPage),
      byPrinter: sortDesc(perPrinter),
      byFilament: sortDesc(perFilament),
      byTopic: sortDesc(perTopic),
      chatMessages,
      recent: events.slice(0, 30).map((row) => ({
        id: row.id,
        eventName: row.event_name,
        pagePath: row.page_path,
        printerId: row.printer_id,
        filamentType: row.filament_type,
        createdAt: row.created_at,
        signedIn: Boolean(row.user_id),
      })),
    };
  });

function rangeStart(range: "24h" | "7d" | "30d" | "all"): string | null {
  if (range === "all") return null;
  const hours = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function bump(map: Map<string, number>, key: string) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + 1);
}

function toRows(map: Map<string, number>): CountRow[] {
  return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
}

function sortDesc(map: Map<string, number>): CountRow[] {
  return toRows(map).sort((a, b) => b.count - a.count);
}

/**
 * Server-side admin check for route guards. The role lookup happens under the
 * caller's verified session; the private has_role function is never exposed.
 */
export const isCurrentUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .limit(1);
    if (error) return { isAdmin: false };
    return { isAdmin: (data?.length ?? 0) > 0 };
  });
