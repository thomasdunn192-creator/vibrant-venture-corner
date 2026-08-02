import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { useAppSettingsContext } from "@/components/app-settings-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { isOverridden, isStockPrinter, type Printer } from "@/lib/printers";
import { useTrackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/printers")({
  component: PrintersPage,
  head: () => ({
    meta: [
      { title: "Printer Profiles — PrintOps" },
      {
        name: "description",
        content:
          "Edit printer specs, temperature limits, and enclosure details, or add your own custom 3D printer profile.",
      },
      { property: "og:title", content: "Printer Profiles — PrintOps" },
      {
        property: "og:description",
        content: "Edit printer specs and limits, or add your own custom 3D printer profile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function PrintersPage() {
  const {
    settings,
    printers,
    updatePrinter,
    resetPrinter,
    addCustomPrinter,
    deleteCustomPrinter,
    setSelectedPrinterId,
    accountSyncEnabled,
    forgetRemotePrinter,
  } = useAppSettingsContext();
  const track = useTrackEvent();
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    const printer = addCustomPrinter(name);
    setNewName("");
    setSelectedPrinterId(printer.id);
    track({ eventName: "printer_created", printerId: printer.id });
    toast.success(`${name} added`, { description: "Adjust its specs below." });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Printer Profiles</h1>
          <p className="text-sm text-muted-foreground">
            Edit the specs PrintOps uses for warnings and recommendations, or add a printer of your
            own.{" "}
            {accountSyncEnabled
              ? "Your edits are saved to your account."
              : "Your edits are saved in this browser. Sign in to sync them."}
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add a printer</CardTitle>
            <CardDescription>
              Start from a generic 220 x 220 x 250 mm profile and tune it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newName}
                maxLength={60}
                placeholder="e.g. Voron 2.4 350"
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                aria-label="New printer name"
              />
              <Button onClick={handleAdd} disabled={!newName.trim()} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add printer
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {printers.map((printer) => (
            <PrinterEditor
              key={printer.id}
              printer={printer}
              edited={isOverridden(printer, settings.printerOverrides)}
              onChange={(patch) => {
                updatePrinter(printer.id, patch);
                track({ eventName: "printer_edited", printerId: printer.id });
              }}
              onReset={() => {
                resetPrinter(printer.id);
                toast.success(`${printer.shortName} reset to stock specs`);
              }}
              onDelete={
                printer.custom
                  ? () => {
                      deleteCustomPrinter(printer.id);
                      forgetRemotePrinter(printer.id);
                      toast.success(`${printer.name} deleted`);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

interface EditorProps {
  printer: Printer;
  edited: boolean;
  onChange: (patch: Partial<Printer>) => void;
  onReset: () => void;
  onDelete?: () => void;
}

function PrinterEditor({ printer, edited, onChange, onReset, onDelete }: EditorProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={printer.image}
            alt={printer.name}
            className="h-12 w-12 rounded-md object-cover"
            loading="lazy"
          />
          <div>
            <CardTitle className="text-base">{printer.name}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2">
              {printer.custom ? "Custom printer" : "Stock printer"}
              {edited && <Badge variant="secondary">Edited</Badge>}
              {printer.flagship && <Badge>Flagship</Badge>}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isStockPrinter(printer.id) && edited && (
            <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="gap-1.5 text-destructive">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" id={`${printer.id}-name`}>
          <Input
            id={`${printer.id}-name`}
            value={printer.name}
            maxLength={60}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Field>
        <Field label="Short name" id={`${printer.id}-short`}>
          <Input
            id={`${printer.id}-short`}
            value={printer.shortName}
            maxLength={20}
            onChange={(e) => onChange({ shortName: e.target.value })}
          />
        </Field>
        <Field label="Build volume" id={`${printer.id}-volume`}>
          <Input
            id={`${printer.id}-volume`}
            value={printer.buildVolume}
            maxLength={60}
            onChange={(e) => onChange({ buildVolume: e.target.value })}
          />
        </Field>
        <Field label="Nozzle diameter (mm)" id={`${printer.id}-nozzle-dia`}>
          <Input
            id={`${printer.id}-nozzle-dia`}
            type="number"
            step="0.05"
            min="0.1"
            max="1.2"
            value={printer.nozzleDiameterDefault}
            onChange={(e) => onChange({ nozzleDiameterDefault: Number(e.target.value) })}
          />
        </Field>
        <Field label="Max nozzle temp (°C)" id={`${printer.id}-max-nozzle`}>
          <Input
            id={`${printer.id}-max-nozzle`}
            type="number"
            min="150"
            max="500"
            value={printer.maxNozzleTemp}
            onChange={(e) => onChange({ maxNozzleTemp: Number(e.target.value) })}
          />
        </Field>
        <Field label="Max bed temp (°C)" id={`${printer.id}-max-bed`}>
          <Input
            id={`${printer.id}-max-bed`}
            type="number"
            min="0"
            max="200"
            value={printer.maxBedTemp}
            onChange={(e) => onChange({ maxBedTemp: Number(e.target.value) })}
          />
        </Field>
        <Field label="Extruder" id={`${printer.id}-extruder`}>
          <Select
            value={printer.extruderType}
            onValueChange={(v) => onChange({ extruderType: v as Printer["extruderType"] })}
          >
            <SelectTrigger id={`${printer.id}-extruder`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Direct drive</SelectItem>
              <SelectItem value="bowden">Bowden</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor={`${printer.id}-enclosure`} className="text-sm font-normal">
              Enclosure
            </Label>
            <Switch
              id={`${printer.id}-enclosure`}
              checked={printer.hasEnclosure}
              onCheckedChange={(checked) => onChange({ hasEnclosure: checked })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor={`${printer.id}-chamber`} className="text-sm font-normal">
              Heated chamber
            </Label>
            <Switch
              id={`${printer.id}-chamber`}
              checked={printer.hasHeatedChamber}
              onCheckedChange={(checked) => onChange({ hasHeatedChamber: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
