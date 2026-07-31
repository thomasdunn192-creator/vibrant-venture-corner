import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical, MessageSquareText, Wrench, ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { useAppSettingsContext } from "@/components/app-settings-provider";
import { PRINTERS, getPrinterById } from "@/lib/printers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "PrintOps — Dial in your printer. Fix problems fast." },
      {
        name: "description",
        content:
          "Setup, filament settings, and troubleshooting companion for desktop 3D printers including MakerGear Ultra One, Bambu Lab P1S, Prusa, and Creality.",
      },
      { property: "og:title", content: "PrintOps — Dial in your printer. Fix problems fast." },
      {
        property: "og:description",
        content:
          "Setup, filament settings, and troubleshooting companion for desktop 3D printers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function HomePage() {
  const { settings, setSelectedPrinterId } = useAppSettingsContext();

  const features = [
    {
      title: "Filament Settings",
      description:
        "Per-printer, per-filament starting points tuned for your machine. Edit, save, and reset anytime.",
      icon: FlaskConical,
      to: "/filament",
    },
    {
      title: "Setup & Calibration",
      description:
        "Step-by-step guides from unboxing to first print. Track progress and never lose your place.",
      icon: Wrench,
      to: "/setup",
    },
    {
      title: "Troubleshooting & AI Chat",
      description:
        "Browse common symptoms and fixes, then ask the AI assistant for personalized help.",
      icon: MessageSquareText,
      to: "/troubleshooting",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-12">
        {/* Hero */}
        <section className="text-center">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              PrintOps
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Dial in your printer. Fix problems fast.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild>
                <Link to="/filament">Get settings</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/troubleshooting">Troubleshoot</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                to={feature.to}
                className="group block rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground group-hover:text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </Link>
            );
          })}
        </section>

        {/* Printer picker */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Pick your printer</h2>
            <span className="text-sm text-muted-foreground">Selection persists across pages</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRINTERS.map((printer) => {
              const isSelected = settings.selectedPrinterId === printer.id;
              const isFlagship = printer.flagship;
              return (
                <button
                  key={printer.id}
                  onClick={() => setSelectedPrinterId(printer.id)}
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected ? "border-primary ring-1 ring-primary" : "border-border",
                    isFlagship && "sm:col-span-2 sm:row-span-2 lg:col-span-1 lg:row-span-1",
                  )}
                >
                  {isFlagship && (
                    <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      Flagship
                    </span>
                  )}
                  <div className="flex flex-col items-center gap-3 p-4">
                    <img
                      src={printer.image}
                      alt={printer.name}
                      className={cn(
                        "rounded-lg object-cover",
                        isFlagship ? "h-40 w-40" : "h-24 w-24",
                      )}
                      loading="lazy"
                    />
                    <div className="text-center">
                      <h3 className="font-semibold text-card-foreground">{printer.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {printer.buildVolume} · {printer.extruderType} drive
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="border-t border-border bg-accent/30 px-4 py-2 text-center text-xs font-medium text-accent-foreground">
                      Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {["Pick your printer", "Get your settings", "Print with confidence"].map(
              (step, index, arr) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-card-foreground">{step}</span>
                  {index < arr.length - 1 && (
                    <ChevronRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
                  )}
                </div>
              ),
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
