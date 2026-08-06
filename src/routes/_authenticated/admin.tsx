import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BarChart3, Download, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsageMetrics, isCurrentUserAdmin, type CountRow, type UsageMetrics } from "@/lib/analytics.functions";


export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const userId = (context as { user?: { id: string } }).user?.id;
    if (!userId) throw redirect({ to: "/auth" });
    const { isAdmin } = await isCurrentUserAdmin().catch(() => ({ isAdmin: false }));
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Usage metrics — PrintOps admin" },
      {
        name: "description",
        content: "Admin dashboard showing PrintOps page views, printer and filament usage, and AI chat activity.",
      },
      { property: "og:title", content: "Usage metrics — PrintOps admin" },
      {
        property: "og:description",
        content: "Admin dashboard showing PrintOps page views, printer and filament usage, and AI chat activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/**
 * Estimated AI cost per token, in USD, for google/gemini-2.5-flash.
 * UPDATE THESE if Gemini pricing changes — otherwise the cost estimate below
 * silently goes stale. Values are per single token (price per 1M / 1_000_000).
 */
const PRICE_PER_INPUT_TOKEN_USD = 0.30 / 1_000_000;
const PRICE_PER_OUTPUT_TOKEN_USD = 2.50 / 1_000_000;
/** Blended rate used for totals, since we aggregate total tokens per response. */
const BLENDED_PRICE_PER_TOKEN_USD =
  (PRICE_PER_INPUT_TOKEN_USD + PRICE_PER_OUTPUT_TOKEN_USD) / 2;

function estimateCostUsd(tokens: number): string {
  const cost = tokens * BLENDED_PRICE_PER_TOKEN_USD;
  return cost < 0.01 && cost > 0 ? "<$0.01" : `$${cost.toFixed(2)}`;
}

const RANGES = [
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
] as const;

function buildCsv(metrics: UsageMetrics, range: string): string {
  const rows: string[] = [];
  rows.push(`PrintOps usage metrics — ${range}`);
  rows.push("");

  rows.push(`Summary`);
  rows.push(`Events,${metrics.totalEvents}`);
  rows.push(`Unique visitors,${metrics.uniqueVisitors}`);
  rows.push(`Signed-in users,${metrics.signedInUsers}`);
  rows.push(`AI chat messages,${metrics.chatMessages}`);
  rows.push(`Filament resets,${metrics.resets}`);
  rows.push(`Printer-wide resets,${metrics.resetAlls}`);
  rows.push("");

  rows.push(`AI token usage`);
  rows.push(`Today,${metrics.tokens.today},${estimateCostUsd(metrics.tokens.today)}`);
  rows.push(`This week,${metrics.tokens.week},${estimateCostUsd(metrics.tokens.week)}`);
  rows.push(`All time,${metrics.tokens.allTime},${estimateCostUsd(metrics.tokens.allTime)}`);
  rows.push("");

  const section = (title: string, data: CountRow[]) => {
    rows.push(title);
    rows.push("Label,Count");
    for (const row of data) rows.push(`"${row.label}",${row.count}`);
    rows.push("");
  };

  section("Page views", metrics.byPage);
  section("Events", metrics.byEvent);
  section("Printers", metrics.byPrinter);
  section("Filaments", metrics.byFilament);
  section("Troubleshooting topics", metrics.byTopic);
  section("Most edited defaults", metrics.byEditedField);
  section("Activity by day", metrics.eventsPerDay);

  return rows.join("\n");
}

function downloadCsv(metrics: UsageMetrics, range: string) {
  const csv = buildCsv(metrics, range);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `printops-metrics-${range}-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function AdminPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]["value"]>("7d");
  const fetchMetrics = useServerFn(getUsageMetrics);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["usage-metrics", range],
    queryFn: () => fetchMetrics({ data: { range } }),
  });

  const forbidden = error instanceof Error && /forbidden/i.test(error.message);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <BarChart3 className="h-6 w-6 text-primary" />
              Usage metrics
            </h1>
            <p className="text-sm text-muted-foreground">
              How the app is being used, and what people touch on each page.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RANGES.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant={range === r.value ? "default" : "outline"}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => void refetch()} aria-label="Refresh">
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>
          </div>
        </div>

        {forbidden && (
          <Card>
            <CardHeader>
              <CardTitle>Admin access required</CardTitle>
              <CardDescription>
                Your account doesn't have the admin role, so usage metrics are hidden.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!forbidden && error && (
          <Card>
            <CardHeader>
              <CardTitle>Couldn't load metrics</CardTitle>
              <CardDescription>{(error as Error).message}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Loading metrics…</p>}

        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Events" value={data.totalEvents} />
              <StatCard label="Unique visitors" value={data.uniqueVisitors} />
              <StatCard label="Signed-in users" value={data.signedInUsers} />
              <StatCard label="AI chat messages" value={data.chatMessages} />
              <StatCard label="Filament resets" value={data.resets} />
              <StatCard label="Printer-wide resets" value={data.resetAlls} />
            </div>


            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI token usage &amp; estimated cost</CardTitle>
                <CardDescription>
                  Tokens reported by the AI for each chat response. Cost is an estimate at a blended
                  Gemini rate — update the price constants in this file if pricing changes.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ["Today", data.tokens.today],
                    ["This week", data.tokens.week],
                    ["All time", data.tokens.allTime],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                      {value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ≈ {estimateCostUsd(value)} estimated
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <BreakdownCard
                title="Chat volume by day"
                description="AI chat messages sent per day (last 14 days)"
                rows={data.chatVolumeByDay}
              />
              <BreakdownCard
                title="Chat volume by week"
                description="AI chat messages sent per week (last 8 weeks)"
                rows={data.chatVolumeByWeek}
              />
              <BreakdownCard
                title="Page views"
                description="Which pages get used most"
                rows={data.byPage}
              />
              <BreakdownCard
                title="Events"
                description="Every tracked interaction"
                rows={data.byEvent}
              />
              <BreakdownCard
                title="Printers"
                description="Printer selected when events fired"
                rows={data.byPrinter}
              />
              <BreakdownCard
                title="Filaments"
                description="Filament type in context"
                rows={data.byFilament}
              />
              <BreakdownCard
                title="Troubleshooting topics"
                description="Symptoms opened or sent to the AI"
                rows={data.byTopic}
              />
              <BreakdownCard
                title="Most edited defaults"
                description="Printer · filament · field changed away from default"
                rows={data.byEditedField}
              />

              <BreakdownCard
                title="Activity by day"
                description="Events per day"
                rows={data.eventsPerDay}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest 30 events</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-4">When</th>
                      <th className="py-2 pr-4">Event</th>
                      <th className="py-2 pr-4">Page</th>
                      <th className="py-2 pr-4">Printer</th>
                      <th className="py-2 pr-4">Filament</th>
                      <th className="py-2">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((row) => (
                      <tr key={row.id} className="border-b border-border/50">
                        <td className="py-2 pr-4 text-muted-foreground">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 font-medium text-foreground">{row.eventName}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{row.pagePath ?? "—"}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{row.printerId ?? "—"}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{row.filamentType ?? "—"}</td>
                        <td className="py-2 text-muted-foreground">
                          {row.signedIn ? "signed in" : "anonymous"}
                        </td>
                      </tr>
                    ))}
                    {data.recent.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-muted-foreground">
                          No events in this range yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: CountRow[];
}) {
  const max = rows.reduce((acc, r) => Math.max(acc, r.count), 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
        {rows.slice(0, 12).map((row) => (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-foreground">{row.label}</span>
              <span className="shrink-0 font-medium text-muted-foreground">{row.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${max > 0 ? (row.count / max) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
