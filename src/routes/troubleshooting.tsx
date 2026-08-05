import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Thermometer,
  Layers,
  Move,
  Droplets,
  CircleDot,
  Paintbrush,
  AlertTriangle,
  Grid3X3,
  BookmarkPlus,
  Check,
  History,
} from "lucide-react";


import { AppShell } from "@/components/app-shell";
import { PrinterSelector } from "@/components/printer-selector";
import { useAppSettingsContext } from "@/components/app-settings-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useServerFn } from "@tanstack/react-start";
import { chatWithAssistant } from "@/lib/ai.functions";
import { MAX_MESSAGE_LENGTH } from "@/lib/ai-limits";

import { getPrinterById } from "@/lib/printers";
import { getProfile } from "@/lib/settings";
import { useTrackEvent } from "@/lib/analytics";
import { useTroubleshootingLog } from "@/lib/history";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/troubleshooting")({
  component: TroubleshootingPage,
  head: () => ({
    meta: [
      { title: "Troubleshooting & AI Chat — PrintOps" },
      {
        name: "description",
        content:
          "Common 3D printing symptoms and fixes, plus an AI assistant that knows your printer and current settings.",
      },
      { property: "og:title", content: "Troubleshooting & AI Chat — PrintOps" },
      {
        property: "og:description",
        content:
          "Common 3D printing symptoms and fixes, plus an AI assistant that knows your printer and current settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

interface TroubleshootingTopic {
  icon: React.ComponentType<{ className?: string }>;
  symptom: string;
  causes: string[];
  fixes: string[];
}

const TOPICS: TroubleshootingTopic[] = [
  {
    icon: Grid3X3,
    symptom: "Adhesion problems",
    causes: [
      "Bed not clean or greasy",
      "Nozzle too far from bed",
      "Bed temperature too low for material",
      "Drafts cooling the first layer",
    ],
    fixes: [
      "Clean bed with isopropyl alcohol and re-level",
      "Raise bed temp 5–10°C for the filament",
      "Use brim or raft for small parts",
      "Disable fans for the first 3 layers",
    ],
  },
  {
    icon: Droplets,
    symptom: "Stringing / oozing",
    causes: [
      "Retraction distance too low",
      "Retraction speed too slow",
      "Nozzle temp too high",
      "Travel speed too slow",
    ],
    fixes: [
      "Increase retraction distance in 0.2mm steps",
      "Increase retraction speed in 5–10mm/s steps",
      "Lower nozzle temp by 5°C",
      "Raise travel speed to 150–200mm/s",
    ],
  },
  {
    icon: Move,
    symptom: "Layer shifting",
    causes: [
      "Loose belts",
      "Pulley grub screws loose",
      "Acceleration/jerk too high",
      "Mechanical obstruction or binding",
    ],
    fixes: [
      "Tension belts until they twang like a low guitar note",
      "Check and tighten all pulley grub screws",
      "Lower acceleration and jerk in slicer",
      "Inspect rails and wheels for debris or flat spots",
    ],
  },
  {
    icon: Thermometer,
    symptom: "Under-extrusion / clogs",
    causes: [
      "Partial clog in nozzle",
      "Insufficient nozzle temp",
      "Worn or cracked PTFE tube",
      "Filament diameter inconsistent",
    ],
    fixes: [
      "Cold-pull or nozzle clean at working temp",
      "Raise nozzle temp 5–10°C",
      "Replace PTFE tube if it has browned or cracked",
      "Measure filament diameter and set average in slicer",
    ],
  },
  {
    icon: CircleDot,
    symptom: "Over-extrusion / blobbing",
    causes: [
      "Flow rate too high",
      "Nozzle too close to bed",
      "Nozzle temp too high",
      "Bad retraction settings",
    ],
    fixes: [
      "Reduce flow/extrusion multiplier in 2% steps",
      "Re-tram bed and increase first-layer gap",
      "Lower nozzle temp 5°C",
      "Tune retraction distance and speed",
    ],
  },
  {
    icon: Paintbrush,
    symptom: "Poor surface finish / ringing",
    causes: [
      "Belt resonance / loose frame",
      "Acceleration too high",
      "Mechanical vibration",
      "Dampeners worn out",
    ],
    fixes: [
      "Lower acceleration and jerk",
      "Tighten frame bolts and belts",
      "Move printer to a stiffer surface",
      "Enable input shaping if firmware supports it",
    ],
  },
  {
    icon: AlertTriangle,
    symptom: "Nozzle / hotend leaks",
    causes: [
      "Nozzle not tight against heatbreak",
      "Damaged or missing nozzle seal",
      "Hotend assembled at wrong temp",
    ],
    fixes: [
      "Hot-tighten nozzle at 240–260°C",
      "Inspect PTFE and heatbreak mating surface",
      "Replace nozzle if deformed or damaged",
    ],
  },
  {
    icon: Grid3X3,
    symptom: "Bed leveling drift",
    causes: [
      "Bed screws loosening",
      "Thermal expansion",
      "Probe inconsistent",
      "Build plate warped",
    ],
    fixes: [
      "Re-tram bed and use nyloc nuts if needed",
      "Heat soak bed for 5–10 minutes before probing",
      "Clean probe tip and check magnet contacts",
      "Replace warped build plate",
    ],
  },
  {
    icon: Layers,
    symptom: "Dual-extruder issues (Ultra One)",
    causes: [
      "Nozzle offset drift",
      "One extruder not priming",
      "Purge tower too small",
      "Material loaded incorrectly",
    ],
    fixes: [
      "Re-measure nozzle X/Y/Z offset with calibration print",
      "Prime each extruder individually before starting print",
      "Increase purge tower volume and prime pillar",
      "Verify extruder drive gear tension and filament path",
    ],
  },
  {
    icon: Thermometer,
    symptom: "Enclosure / chamber issues (P1S, Core One)",
    causes: [
      "PLA overheating in chamber",
      "Chamber temp not reaching target",
      "Aux fan not running",
      "Door seal leaking",
    ],
    fixes: [
      "Open door/panels for PLA and keep chamber temp low",
      "Verify chamber heater and door seal for ABS/ASA/Nylon",
      "Check aux fan wiring and slicer settings",
      "Replace worn door gaskets",
    ],
  },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PendingMessage {
  text: string;
  nonce: number;
}

interface ChatPanelProps {
  pending: PendingMessage | null;
  signedIn: boolean;
  onSaveExchange: (question: string, answer: string) => void;
}

function ChatPanel({ pending, signedIn, onSaveExchange }: ChatPanelProps) {
  const { settings } = useAppSettingsContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIndexes, setSavedIndexes] = useState<number[]>([]);
  const [guestNotifiedIndex, setGuestNotifiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chat = useServerFn(chatWithAssistant);
  const track = useTrackEvent();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const lastNonce = useRef<number | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (guestNotifiedIndex === null) return;
    const t = setTimeout(() => setGuestNotifiedIndex(null), 5000);
    return () => clearTimeout(t);
  }, [guestNotifiedIndex]);


  const send = useCallback(
    async (userText: string) => {
      if (!userText.trim() || sendingRef.current) return;
      sendingRef.current = true;
      const current = settingsRef.current;
      setInput("");
      setError(null);
      setMessages((prev) => [...prev, { role: "user", content: userText }]);
      setLoading(true);
      track({
        eventName: "chat_message_sent",
        printerId: current.selectedPrinterId,
        filamentType: current.selectedFilamentType,
      });

      try {
        const profile = getProfile(current, current.selectedPrinterId, current.selectedFilamentType);
        const result = await chat({
          data: {
            printerId: current.selectedPrinterId,
            filamentType: current.selectedFilamentType,
            profile: {
              nozzleTempC: { current: profile.nozzleTempC.current },
              bedTempC: { current: profile.bedTempC.current },
              printSpeedMmS: { current: profile.printSpeedMmS.current },
              fanSpeedPercent: { current: profile.fanSpeedPercent.current },
              retractionDistanceMm: { current: profile.retractionDistanceMm.current },
              retractionSpeedMmS: { current: profile.retractionSpeedMmS.current },
              chamberTempC: {
                applicable: profile.chamberTempC.applicable,
                current: profile.chamberTempC.current,
              },
            },
            messages: [{ role: "user", content: userText }],
            topic: userText,
          },
        });
        setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
        sendingRef.current = false;
      }
    },
    [chat, track],
  );

  useEffect(() => {
    if (!pending) return;
    if (lastNonce.current === pending.nonce) return;
    lastNonce.current = pending.nonce;
    void send(pending.text);
  }, [pending, send]);

  const handleSend = () => {
    void send(input.trim());
  };


  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
        <CardDescription>
          Context: {getPrinterById(settings.selectedPrinterId).shortName} ·{" "}
          {settings.selectedFilamentType}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-4">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              Ask me about any symptom, setting, or 3D printing question. I already know your
              selected printer and filament.
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-2",
                msg.role === "assistant" ? "flex-row" : "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "assistant" ? "bg-primary/10 text-primary" : "bg-muted text-foreground",
                )}
              >
                {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className="max-w-[80%] space-y-1">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 text-sm",
                    msg.role === "assistant"
                      ? "rounded-tl-none bg-muted text-foreground"
                      : "rounded-tr-none bg-primary text-primary-foreground",
                  )}
                >
                  <FormattedMessage text={msg.content} markdown={msg.role === "assistant"} />
                </div>
                {msg.role === "assistant" && (
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      disabled={savedIndexes.includes(index)}
                      onClick={() => {
                        const question = messages[index - 1]?.content ?? "";
                        onSaveExchange(question, msg.content);
                        setSavedIndexes((prev) => [...prev, index]);
                        if (!signedIn) setGuestNotifiedIndex(index);
                      }}
                    >
                      {savedIndexes.includes(index) ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Saved to log
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="mr-1 h-3.5 w-3.5" />
                          Save to log
                        </>
                      )}
                    </Button>
                    {!signedIn && savedIndexes.includes(index) && guestNotifiedIndex === index && (
                      <p className="text-xs text-muted-foreground">
                        Saved on this device — sign in to keep it synced across devices.
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-2 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex gap-2">
          <Input
            placeholder="e.g. Why is my first layer not sticking?"
            value={input}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {input.length >= MAX_MESSAGE_LENGTH - 200 && (
          <p
            className={`mt-2 text-right text-xs ${
              input.length >= MAX_MESSAGE_LENGTH ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {input.length} / {MAX_MESSAGE_LENGTH}
          </p>
        )}

      </CardContent>
    </Card>
  );
}

function FormattedMessage({ text, markdown }: { text: string; markdown?: boolean }) {
  if (markdown) {
    return (
      <div className="text-sm leading-relaxed text-foreground">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="mb-2 list-disc pl-4 last:mb-0">{children}</ul>,
            ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 last:mb-0">{children}</ol>,
            li: ({ children }) => <li className="mb-0.5">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  }
  return <p className="whitespace-pre-wrap">{text}</p>;
}

function TroubleshootingPage() {
  const { settings, setSelectedPrinterId } = useAppSettingsContext();
  const [pending, setPending] = useState<PendingMessage | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const track = useTrackEvent();
  const { addEntry, signedIn } = useTroubleshootingLog();

  const askAi = (symptom: string) => {
    const text = `I'm having ${symptom.toLowerCase()} on my ${getPrinterById(settings.selectedPrinterId).name}. What should I check and fix?`;
    setPending({ text, nonce: Date.now() });
    track({
      eventName: "ask_ai_pressed",
      printerId: settings.selectedPrinterId,
      filamentType: settings.selectedFilamentType,
      detail: { topic: symptom },
    });
    requestAnimationFrame(() => {
      chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const saveSymptom = (symptom: string) => {
    addEntry({
      kind: "symptom",
      title: symptom,
      printerId: settings.selectedPrinterId,
      filamentType: settings.selectedFilamentType,
    });
    toast.success("Saved to your troubleshooting log");
  };

  const saveExchange = (question: string, answer: string) => {
    addEntry({
      kind: "chat",
      title: question.slice(0, 120) || "AI conversation",
      printerId: settings.selectedPrinterId,
      filamentType: settings.selectedFilamentType,
      question,
      answer,
    });
    toast.success("Saved to your troubleshooting log");
  };




  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Troubleshooting
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse symptoms, or ask the AI for personalized help.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/history">
                <History className="mr-1.5 h-4 w-4" />
                My history
              </Link>
            </Button>
          </div>

          <PrinterSelector
            value={settings.selectedPrinterId}
            onChange={setSelectedPrinterId}
            className="w-44"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
              {TOPICS.map((topic) => {
                const Icon = topic.icon;
                return (
                  <AccordionItem key={topic.symptom} value={topic.symptom}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground">{topic.symptom}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <h4 className="mb-1 text-sm font-semibold text-foreground">Likely causes</h4>
                        <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                          {topic.causes.map((cause, i) => (
                            <li key={i}>{cause}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-1 text-sm font-semibold text-foreground">Fix steps</h4>
                        <ol className="list-decimal space-y-0.5 pl-5 text-sm text-muted-foreground">
                          {topic.fixes.map((fix, i) => (
                            <li key={i}>{fix}</li>
                          ))}
                        </ol>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => askAi(topic.symptom)}
                        >
                          <Sparkles className="mr-1.5 h-4 w-4" />
                          Ask the AI about this
                        </Button>
                        {signedIn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveSymptom(topic.symptom)}
                          >
                            <BookmarkPlus className="mr-1.5 h-4 w-4" />
                            Save to log
                          </Button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          <div ref={chatRef} className="lg:sticky lg:top-24 lg:self-start">
            <ChatPanel
              pending={pending}
              canSave={signedIn}
              onSaveExchange={saveExchange}
            />
          </div>


        </div>
      </div>
    </AppShell>
  );
}
