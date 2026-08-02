import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { deleteLogEntry, fetchLogEntries, pushLogEntries } from "./history.functions";

const STORAGE_KEY = "printops-history-v1";
const MAX_ENTRIES = 200;

export type LogKind = "symptom" | "chat" | "setting";
export type LogOutcome = "open" | "resolved" | "unresolved" | "testing";

export interface LogEntry {
  id: string;
  kind: LogKind;
  title: string;
  printerId?: string;
  filamentType?: string;
  question?: string;
  answer?: string;
  notes?: string;
  outcome: LogOutcome;
  imagePaths?: string[];
  occurredAt: string;
}

export const OUTCOME_LABELS: Record<LogOutcome, string> = {
  open: "No outcome yet",
  resolved: "Resolved",
  unresolved: "Not resolved",
  testing: "Still testing",
};

export function loadLog(): LogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(entries: LogEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // ignore quota errors
  }
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sortEntries(entries: LogEntry[]): LogEntry[] {
  return [...entries].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
}

function toRemote(entry: LogEntry) {
  return {
    localId: entry.id,
    kind: entry.kind,
    title: entry.title,
    printerId: entry.printerId ?? null,
    filamentType: entry.filamentType ?? null,
    question: entry.question ?? null,
    answer: entry.answer ?? null,
    notes: entry.notes ?? null,
    outcome: entry.outcome,
    imagePaths: entry.imagePaths ?? [],
    occurredAt: entry.occurredAt,
  };
}

/**
 * Troubleshooting history. Always kept in the browser; mirrored to the
 * signed-in user's account so it follows them across devices.
 */
export function useTroubleshootingLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const signedInRef = useRef(false);
  const pull = useServerFn(fetchLogEntries);
  const push = useServerFn(pushLogEntries);
  const remove = useServerFn(deleteLogEntry);

  useEffect(() => {
    setEntries(sortEntries(loadLog()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persist(entries);
  }, [entries, hydrated]);

  useEffect(() => {
    let active = true;
    const update = (isSignedIn: boolean) => {
      if (!active) return;
      signedInRef.current = isSignedIn;
      setSignedIn(isSignedIn);
    };
    void supabase.auth.getSession().then(({ data }) => update(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => update(Boolean(session)));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (!signedInRef.current) return;
    setSyncing(true);
    try {
      const remote = await pull({});
      const local = loadLog();
      const byId = new Map<string, LogEntry>();
      for (const row of remote) {
        byId.set(row.localId, {
          id: row.localId,
          kind: row.kind,
          title: row.title,
          ...(row.printerId ? { printerId: row.printerId } : {}),
          ...(row.filamentType ? { filamentType: row.filamentType } : {}),
          ...(row.question ? { question: row.question } : {}),
          ...(row.answer ? { answer: row.answer } : {}),
          ...(row.notes ? { notes: row.notes } : {}),
          outcome: row.outcome,
          imagePaths: row.imagePaths,
          occurredAt: row.occurredAt,
        });
      }
      const localOnly: LogEntry[] = [];
      for (const entry of local) {
        if (!byId.has(entry.id)) {
          byId.set(entry.id, entry);
          localOnly.push(entry);
        }
      }
      const merged = sortEntries([...byId.values()]).slice(0, MAX_ENTRIES);
      setEntries(merged);
      if (localOnly.length > 0) {
        await push({ data: { entries: localOnly.slice(0, 200).map(toRemote) } });
      }
    } catch {
      // Offline or not authorized: local history still works.
    } finally {
      setSyncing(false);
    }
  }, [pull, push]);

  useEffect(() => {
    if (!hydrated || !signedIn) return;
    void syncNow();
  }, [hydrated, signedIn, syncNow]);

  const save = useCallback(
    (entry: LogEntry) => {
      if (!signedInRef.current) return;
      void push({ data: { entries: [toRemote(entry)] } }).catch(() => {
        // history is local-first; ignore sync failures
      });
    },
    [push],
  );

  const addEntry = useCallback(
    (input: Omit<LogEntry, "id" | "occurredAt" | "outcome"> & { outcome?: LogOutcome }): LogEntry => {
      const entry: LogEntry = {
        id: newId(),
        occurredAt: new Date().toISOString(),
        outcome: input.outcome ?? "open",
        ...input,
      };
      setEntries((prev) => sortEntries([entry, ...prev]).slice(0, MAX_ENTRIES));
      save(entry);
      return entry;
    },
    [save],
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<LogEntry, "id">>) => {
      setEntries((prev) => {
        const next = prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
        const updated = next.find((entry) => entry.id === id);
        if (updated) save(updated);
        return next;
      });
    },
    [save],
  );

  const deleteEntry = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      if (signedInRef.current) {
        void remove({ data: { localId: id } }).catch(() => {
          // ignore
        });
      }
    },
    [remove],
  );

  const clearAll = useCallback(() => {
    const current = loadLog();
    setEntries([]);
    if (signedInRef.current) {
      for (const entry of current) {
        void remove({ data: { localId: entry.id } }).catch(() => {
          // ignore
        });
      }
    }
  }, [remove]);

  return {
    entries,
    hydrated,
    signedIn,
    syncing,
    addEntry,
    updateEntry,
    deleteEntry,
    clearAll,
    syncNow,
  };
}
