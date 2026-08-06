import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PrinterSelector } from "@/components/printer-selector";
import { useAppSettingsContext } from "@/components/app-settings-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { getPrinterById } from "@/lib/printers";
import { getSetupProgress } from "@/lib/settings";
import type { PrinterId } from "@/lib/printers";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
  head: () => ({
    meta: [
      { title: "Setup & Calibration — PrintOps" },
      {
        name: "description",
        content:
          "Step-by-step setup and calibration guides for MakerGear Ultra One, Bambu Lab P1S, Prusa, and Creality 3D printers.",
      },
      { property: "og:title", content: "Setup & Calibration — PrintOps" },
      {
        property: "og:description",
        content:
          "Step-by-step setup and calibration guides for desktop 3D printers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const ULTRA_ONE_STEPS = [
  {
    title: "Unboxing & physical setup",
    detail:
      "Place on a level surface with good ventilation and away from drafts. Remove shipping restraints and check linear rails for shipping damage. Place on a level surface with good ventilation and away from drafts. Remove shipping restraints and check linear rails for shipping damage. 
      Place on a level surface with good ventilation and away from drafts. Remove shipping restraints and check linear rails for shipping damage. 
  
  Place on a level surface with good ventilation and away from drafts. Remove shipping restraints and check linear rails for shipping damage. Place on a level surface with good ventilation and away from drafts. Remove shipping restraints and check linear rails for shipping damage. Place on a level surface with good ventilation and away from drafts. Remove shipping restraints and check linear rails for shipping damage. Place on a level surface with good ventilation and away from drafts. Remove shipping restraints and check linear rails for shipping damage. Place on a level surface with good ventilation and away from drafts. Remove shipping restraints and check linear rails for shipping damage.",
  },
  {
    title: "Initial power-up & network connection",
    detail:
      "Connect to WiFi/Ethernet, register the printer, and check for firmware updates before first use.",
  },
  {
    title: "Bed leveling & mesh calibration",
    detail:
      "Run the touch-probe auto bed leveling, verify the mesh map, and manually fine-tune any low/high spots.",
  },
  {
    title: "Extruder setup (dual independent extruders)",
    detail:
      "Load filament into extruder 1 and 2, set nozzle offsets, and verify both extruders prime correctly.",
  },
  {
    title: "First calibration print",
    detail:
      "Print a temperature tower or calibration cube to verify dimensional accuracy and pick the best temperature.",
  },
  {
    title: "Flow rate / extrusion multiplier calibration",
    detail:
      "Print a single-wall cube, measure wall thickness, and adjust the flow rate until the walls match your target.",
  },
  {
    title: "Retraction tuning",
    detail:
      "Print a retraction tower to dial in retraction distance and speed, minimizing stringing without clogging.",
  },
  {
    title: "Slicer/software setup",
    detail:
      "Install/connect Simplify3D or OctoPrint and import the correct printer and material profiles.",
  },
  {
    title: "Dual-material / soluble support workflow",
    detail:
      "Optional: load BVOH/HIPS in the second extruder, configure purge tower and prime pillar settings.",
  },
  {
    title: "Maintenance checklist",
    detail:
      "Lubricate linear rails, check belt tension, and establish a nozzle cleaning schedule.",
  },
];

const GENERIC_STEPS = [
  {
    title: "Unboxing & placement",
    detail:
      "Place the printer on a stable, level surface with adequate ventilation and away from cold drafts.",
  },
  {
    title: "First power-on & firmware/network setup",
    detail:
      "Power on, connect to WiFi or Ethernet, and update firmware to the latest stable version.",
  },
  {
    title: "Bed leveling",
    detail:
      "Run auto bed leveling or manually tram the bed until the nozzle is consistently close across the surface.",
  },
  {
    title: "Load filament & first calibration print",
    detail:
      "Load your chosen filament and print a calibration cube or temperature tower to verify dimensions.",
  },
  {
    title: "Flow & retraction tuning",
    detail:
      "Calibrate extrusion multiplier and print a retraction tower to reduce stringing.",
  },
  {
    title: "Slicer setup",
    detail:
      "Install Bambu Studio, PrusaSlicer, or Creality Print and import the matching printer profile.",
  },
  {
    title: "Maintenance basics",
    detail:
      "Clean the bed, check belt tension, and keep rails/screws lightly lubricated on schedule.",
  },
];

function SetupSteps({ printerId, steps }: { printerId: PrinterId; steps: typeof ULTRA_ONE_STEPS }) {
  const { settings, toggleSetupStep } = useAppSettingsContext();
  const progress = getSetupProgress(settings, printerId);
  const completed = progress.filter(Boolean).length;
  const percentage = Math.round((completed / steps.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {completed} of {steps.length} completed
        </span>
        <span className="text-sm font-medium text-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />

      <Accordion type="multiple" className="w-full">
        {steps.map((step, index) => {
          const done = progress[index] ?? false;
          return (
            <AccordionItem key={index} value={`step-${index}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center gap-3 text-left">
                  <Checkbox
                    id={`${printerId}-step-${index}`}
                    checked={done}
                    onCheckedChange={() => toggleSetupStep(printerId, index)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Mark step ${index + 1} as done`}
                  />
                  <span className={done ? "text-muted-foreground line-through" : ""}>
                    <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                    {step.title}
                  </span>
                  {done && <Check className="ml-auto h-4 w-4 text-primary" />}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-9 text-muted-foreground">
                {step.detail}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function SetupPage() {
  const { settings, printers, setSelectedPrinterId } = useAppSettingsContext();
  const selected = getPrinterById(settings.selectedPrinterId, printers);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Setup & Calibration
            </h1>
            <p className="text-sm text-muted-foreground">
              Walk through each stage and pick up where you left off.
            </p>
          </div>
          <PrinterSelector
            value={settings.selectedPrinterId}
            onChange={setSelectedPrinterId}
            className="w-44"
          />
        </div>

        <Tabs defaultValue={settings.selectedPrinterId} className="w-full">
          <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {printers.map((printer) => (
              <TabsTrigger
                key={printer.id}
                value={printer.id}
                className="rounded-md border border-transparent px-3 py-1.5 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                onClick={() => setSelectedPrinterId(printer.id)}
              >
                {printer.shortName}
              </TabsTrigger>
            ))}
          </TabsList>

          {printers.map((printer) => (
            <TabsContent key={printer.id} value={printer.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{printer.name}</CardTitle>
                  <CardDescription>
                    {printer.flagship
                      ? "Detailed setup for the MakerGear Ultra One."
                      : "Core setup template for this printer."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SetupSteps
                    printerId={printer.id}
                    steps={printer.id === "makergear-ultra-one" ? ULTRA_ONE_STEPS : GENERIC_STEPS}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  );
}
