import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, MoreHorizontal, AlertTriangle, ShieldAlert } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/app-shell";
import { PrinterSelector } from "@/components/printer-selector";
import { useAppSettingsContext } from "@/components/app-settings-provider";
import { FILAMENT_TYPES, type FilamentType, type FilamentProfile, isModified } from "@/lib/filaments";
import { getPrinterById } from "@/lib/printers";
import { getFilamentCapabilityWarnings, getTempOverrideWarning } from "@/lib/compatibility";
import { useTrackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/filament")({
  component: FilamentPage,
  head: () => ({
    meta: [
      { title: "Filament Settings — PrintOps" },
      {
        name: "description",
        content:
          "Recommended per-printer, per-filament settings for PLA, PETG, ABS, ASA, TPU, and Nylon. Editable and resettable.",
      },
      { property: "og:title", content: "Filament Settings — PrintOps" },
      {
        property: "og:description",
        content:
          "Recommended per-printer, per-filament settings for PLA, PETG, ABS, ASA, TPU, and Nylon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

interface NumberFieldProps {
  label: string;
  value: number;
  defaultValue: number;
  unit: string;
  warning?: string | null;
  onChange: (value: number) => void;
}

function NumberField({ label, value, defaultValue, unit, warning, onChange }: NumberFieldProps) {
  const modified = value !== defaultValue;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-card-foreground">{label}</Label>
        {modified && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Modified
          </span>
        )}
      </div>
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={cn(
            "pr-10",
            modified && "border-primary/50 ring-1 ring-primary/20",
            warning && "border-destructive/60 ring-1 ring-destructive/20",
          )}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {unit}
        </span>
      </div>
      {warning && (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {warning}
        </p>
      )}
    </div>
  );
}

function FilamentPage() {
  const {
    settings,
    setSelectedPrinterId,
    setSelectedFilamentType,
    updateProfile,
    resetProfile,
    resetAllProfilesForPrinter,
  } = useAppSettingsContext();
  const track = useTrackEvent();

  const printer = getPrinterById(settings.selectedPrinterId);
  const filament = settings.selectedFilamentType;
  const profile = settings.profiles[settings.selectedPrinterId][filament];
  const capabilityWarnings = getFilamentCapabilityWarnings(
    settings.selectedPrinterId,
    filament,
    profile,
  );
  const nozzleWarning = getTempOverrideWarning(
    settings.selectedPrinterId,
    "nozzle",
    profile.nozzleTempC.current,
  );
  const bedWarning = getTempOverrideWarning(
    settings.selectedPrinterId,
    "bed",
    profile.bedTempC.current,
  );

  const patch = (partial: Partial<FilamentProfile>) => {
    updateProfile(settings.selectedPrinterId, filament, partial);
  };

  const handleFilamentChange = (value: FilamentType) => {
    setSelectedFilamentType(value);
    track({
      eventName: "filament_selected",
      printerId: settings.selectedPrinterId,
      filamentType: value,
    });
  };



  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Filament Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Starting points for {printer.name}. Fine-tune for your brand.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PrinterSelector
              value={settings.selectedPrinterId}
              onChange={setSelectedPrinterId}
              className="w-44"
            />
            <Select
              value={filament}
              onValueChange={(v) => handleFilamentChange(v as FilamentType)}
            >
              <SelectTrigger className="w-32" aria-label="Select filament">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILAMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Stay inside your printer's limits.</span>{" "}
              We recommend against running filaments that exceed what the {printer.shortName} is
              rated for — hotend up to {printer.maxNozzleTemp}°C, bed up to {printer.maxBedTemp}°C
              {printer.hasEnclosure || printer.hasHeatedChamber ? ", enclosed chamber" : ", open frame"}.
              Pushing past those ratings risks damaging the hotend, bed, or wiring and usually gives
              warped, weak parts. If a material needs more than your machine offers, pick a
              lower-temperature filament instead.
            </p>
          </div>
        </div>

        {capabilityWarnings.length > 0 && (
          <div className="mb-6 space-y-2">
            {capabilityWarnings.map((warning, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm",
                  warning.level === "danger"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-primary/30 bg-primary/5 text-foreground",
                )}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="font-medium">Not recommended: </span>
                  {warning.message}
                </span>
              </div>
            ))}
          </div>
        )}


        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>
                {filament} on {printer.shortName}
              </CardTitle>
              <CardDescription>
                Default values from manufacturer docs and community consensus.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetProfile(settings.selectedPrinterId, filament)}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reset this filament
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More options">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => resetAllProfilesForPrinter(settings.selectedPrinterId)}
                  >
                    Reset all filaments for {printer.shortName}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isModified(profile) && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
                You have modified the default values for this filament. Use the reset button to
                restore them.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Nozzle temperature"
                value={profile.nozzleTempC.current}
                defaultValue={profile.nozzleTempC.default}
                unit="°C"
                onChange={(v) => patch({ nozzleTempC: { ...profile.nozzleTempC, current: v } })}
              />
              <NumberField
                label="Bed temperature"
                value={profile.bedTempC.current}
                defaultValue={profile.bedTempC.default}
                unit="°C"
                onChange={(v) => patch({ bedTempC: { ...profile.bedTempC, current: v } })}
              />
              <NumberField
                label="Print speed"
                value={profile.printSpeedMmS.current}
                defaultValue={profile.printSpeedMmS.default}
                unit="mm/s"
                onChange={(v) => patch({ printSpeedMmS: { ...profile.printSpeedMmS, current: v } })}
              />
              <NumberField
                label="Fan speed"
                value={profile.fanSpeedPercent.current}
                defaultValue={profile.fanSpeedPercent.default}
                unit="%"
                onChange={(v) => patch({ fanSpeedPercent: { ...profile.fanSpeedPercent, current: v } })}
              />
              <NumberField
                label="Retraction distance"
                value={profile.retractionDistanceMm.current}
                defaultValue={profile.retractionDistanceMm.default}
                unit="mm"
                onChange={(v) =>
                  patch({ retractionDistanceMm: { ...profile.retractionDistanceMm, current: v } })
                }
              />
              <NumberField
                label="Retraction speed"
                value={profile.retractionSpeedMmS.current}
                defaultValue={profile.retractionSpeedMmS.default}
                unit="mm/s"
                onChange={(v) =>
                  patch({ retractionSpeedMmS: { ...profile.retractionSpeedMmS, current: v } })
                }
              />
              {profile.chamberTempC.applicable && (
                <NumberField
                  label="Chamber temperature"
                  value={profile.chamberTempC.current}
                  defaultValue={profile.chamberTempC.default}
                  unit="°C"
                  onChange={(v) =>
                    patch({ chamberTempC: { ...profile.chamberTempC, current: v } })
                  }
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm font-medium text-card-foreground">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g. works better with door cracked open, brand-specific quirks..."
                value={profile.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                rows={4}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Starting points — fine-tune for your specific filament brand.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
