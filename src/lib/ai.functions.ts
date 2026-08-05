import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai.server";
import { MAX_MESSAGE_LENGTH } from "./ai-limits";
import type { FilamentProfile } from "./filaments";
import type { PrinterId } from "./printers";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const chatInputSchema = z.object({
  printerId: z.string(),
  filamentType: z.string(),
  profile: z.object({
    nozzleTempC: z.object({ current: z.number() }),
    bedTempC: z.object({ current: z.number() }),
    printSpeedMmS: z.object({ current: z.number() }),
    fanSpeedPercent: z.object({ current: z.number() }),
    retractionDistanceMm: z.object({ current: z.number() }),
    retractionSpeedMmS: z.object({ current: z.number() }),
    chamberTempC: z.object({ applicable: z.boolean(), current: z.number() }),
  }),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string().max(MAX_MESSAGE_LENGTH),
    }),
  ).max(5),
  topic: z.string().optional(),
});

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((data) => chatInputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("AI assistant is not configured.");
    }

    const provider = createLovableAiGatewayProvider(apiKey);

    const context = buildSystemContext(
      data.printerId as PrinterId,
      data.filamentType,
      data.profile as unknown as FilamentProfile,
      data.topic,
    );

    const result = await generateText({
      model: provider("google/gemini-2.5-flash"),
      system: context,
      messages: data.messages.filter((m) => m.role !== "system"),
      temperature: 0.6,
    });

    return { reply: result.text };
  });

function buildSystemContext(
  printerId: PrinterId,
  filamentType: string,
  profile: FilamentProfile,
  topic?: string,
): string {
  const chamberInfo = profile.chamberTempC.applicable
    ? `Chamber temp: ${profile.chamberTempC.current}°C`
    : "No heated chamber";

  return [
    "You are PrintOps, a practical 3D printing assistant embedded in a printer setup and troubleshooting app.",
    "",
    "User context:",
    `- Printer: ${printerId}`,
    `- Filament: ${filamentType}`,
    `- Current settings: Nozzle ${profile.nozzleTempC.current}°C, Bed ${profile.bedTempC.current}°C, Speed ${profile.printSpeedMmS.current}mm/s, Fan ${profile.fanSpeedPercent.current}%, Retraction ${profile.retractionDistanceMm.current}mm @ ${profile.retractionSpeedMmS.current}mm/s, ${chamberInfo}`,
    "",
    topic ? `The user is asking about: ${topic}` : "",
    "",
    "Rules:",
    "- Be concise and specific. Give exact temperatures, speeds, distances, or mechanical checks when possible.",
    "- Avoid vague 'check your settings' answers. Recommend concrete changes and explain why.",
    "- If the user wants to apply a setting change, you can describe it clearly; the app will provide an 'Apply' button when it detects a specific setting recommendation.",
    "- For troubleshooting, list likely causes from most to least probable and give numbered fix steps.",
    "- Keep answers practical for desktop FDM 3D printers.",
  ]
    .filter(Boolean)
    .join("\n");
}
