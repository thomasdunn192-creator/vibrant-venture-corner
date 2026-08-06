import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

import { Bot, History as HistoryIcon, MessageSquareText, Sparkles, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPrinterById } from "@/lib/printers";
import {
  OUTCOME_LABELS,
  useTroubleshootingLog,
  type LogEntry,
  type LogOutcome,
} from "@/lib/history";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "My Troubleshooting History — PrintOps" },
      {
        name: "description",
        content:
          "Review the symptoms you looked into and the AI answers you saved, with your own notes and outcomes.",
      },
      { property: "og:title", content: "My Troubleshooting History — PrintOps" },
      {
        property: "og:description",
        content:
          "Review the symptoms you looked into and the AI answers you saved, with your own notes and outcomes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const OUTCOMES: LogOutcome[] = ["open", "resolved", "unresolved", "testing"];

function HistoryPage() {
  const { entries, hydrated, signedIn, syncing, updateEntry, deleteEntry, clearAll } =
    useTroubleshootingLog();
  const [printerFilter, setPrinterFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");

  const printers = useMemo(
    () => [...new Set(entries.map((e) => e.printerId).filter(Boolean))] as string[],
    [entries],
  );

  const visible = entries.filter(
    (e) =>
      (printerFilter === "all" || e.printerId === printerFilter) &&
      (outcomeFilter === "all" || e.outcome === outcomeFilter),
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Troubleshooting history
            </h1>
            <p className="text-sm text-muted-foreground">
              {signedIn
                ? "Saved to your account and synced across devices."
                : "Sign in to save your history to your account."}
              {syncing ? " Syncing…" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={printerFilter} onValueChange={setPrinterFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Printer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All printers</SelectItem>
                {printers.map((id) => (
                  <SelectItem key={id} value={id}>
                    {getPrinterById(id).shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outcomes</SelectItem>
                {OUTCOMES.map((outcome) => (
                  <SelectItem key={outcome} value={outcome}>
                    {OUTCOME_LABELS[outcome]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {entries.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {!hydrated ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : visible.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <HistoryIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nothing saved yet. Save a symptom or an AI answer from the troubleshooting page.
              </p>
              <Button asChild size="sm">
                <Link to="/troubleshooting">
                  <MessageSquareText className="mr-1.5 h-4 w-4" />
                  Go to troubleshooting
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visible.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onUpdate={(patch) => updateEntry(entry.id, patch)}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EntryCard({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: LogEntry;
  onUpdate: (patch: Partial<Omit<LogEntry, "id">>) => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(entry.notes ?? "");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="min-w-0">
          <CardTitle className="text-base leading-snug">{entry.title}</CardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="capitalize">
              {entry.kind}
            </Badge>
            {entry.printerId && <span>{getPrinterById(entry.printerId).shortName}</span>}
            {entry.filamentType && <span>· {entry.filamentType}</span>}
            <span>· {new Date(entry.occurredAt).toLocaleString()}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete entry">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {entry.question && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">You asked</p>
            <p className="whitespace-pre-wrap">{entry.question}</p>
          </div>
        )}
        {entry.answer && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Bot className="h-3.5 w-3.5" /> Assistant
            </p>
            <p className="whitespace-pre-wrap">{entry.answer}</p>
          </div>
        )}

        <EntryPhotos paths={entry.imagePaths ?? []} />


        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <div>
            <label
              htmlFor={`notes-${entry.id}`}
              className="mb-1 block text-xs font-semibold text-muted-foreground"
            >
              Your notes
            </label>
            <Textarea
              id={`notes-${entry.id}`}
              value={notes}
              rows={2}
              maxLength={4000}
              placeholder="What did you try? What happened?"
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== (entry.notes ?? "")) onUpdate({ notes });
              }}
            />
          </div>
          <div>
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Outcome</span>
            <Select
              value={entry.outcome}
              onValueChange={(value) => onUpdate({ outcome: value as LogOutcome })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((outcome) => (
                  <SelectItem key={outcome} value={outcome}>
                    {OUTCOME_LABELS[outcome]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {entry.kind === "symptom" && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/troubleshooting">
              <Sparkles className="mr-1.5 h-4 w-4" />
              Ask the AI about this again
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
