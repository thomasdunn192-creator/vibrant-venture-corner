/**
 * Lightweight, offline topic categorization for free-typed AI chat questions.
 * Keyword matching only — no AI call, and the raw question text never leaves
 * this function (only the matched category name is ever reported/tracked).
 */

export const CHAT_TOPIC_CATEGORIES = [
  "Adhesion problems",
  "Stringing / oozing",
  "Layer shifting",
  "Under-extrusion / clogs",
  "Over-extrusion / blobbing",
  "Poor surface finish / ringing",
  "Nozzle / hotend leaks",
  "Bed leveling drift",
  "Dual-extruder issues",
  "Enclosure / chamber issues",
  "Other",
] as const;

export type ChatTopicCategory = (typeof CHAT_TOPIC_CATEGORIES)[number];

const KEYWORDS: Array<{ category: ChatTopicCategory; terms: string[] }> = [
  {
    category: "Adhesion problems",
    terms: [
      "adhesion",
      "not sticking",
      "won't stick",
      "wont stick",
      "doesn't stick",
      "warp",
      "warping",
      "curling",
      "lifting",
      "corners lift",
      "first layer",
      "brim",
      "raft",
      "glue stick",
      "detach",
      "popping off",
      "came off the bed",
    ],
  },
  {
    category: "Stringing / oozing",
    terms: [
      "string",
      "stringing",
      "strings",
      "wisp",
      "ooze",
      "oozing",
      "retraction",
      "hairy",
      "cobweb",
      "spider web",
      "travel move",
    ],
  },
  {
    category: "Layer shifting",
    terms: [
      "layer shift",
      "layer shifting",
      "shifted layer",
      "misaligned layer",
      "skipped step",
      "skipping steps",
      "belt tension",
      "loose belt",
      "offset mid print",
      "print is slanted",
      "lean",
    ],
  },
  {
    category: "Under-extrusion / clogs",
    terms: [
      "under extrusion",
      "under-extrusion",
      "underextrusion",
      "clog",
      "clogged",
      "clogging",
      "jam",
      "jammed",
      "gaps",
      "thin lines",
      "missing material",
      "no filament coming",
      "not extruding",
      "grinding filament",
      "heat creep",
      "partial extrusion",
    ],
  },
  {
    category: "Over-extrusion / blobbing",
    terms: [
      "over extrusion",
      "over-extrusion",
      "overextrusion",
      "blob",
      "blobs",
      "blobbing",
      "zit",
      "zits",
      "bulge",
      "too much filament",
      "elephant foot",
      "flow rate too high",
    ],
  },
  {
    category: "Poor surface finish / ringing",
    terms: [
      "surface finish",
      "ringing",
      "ghosting",
      "echo",
      "rough surface",
      "wavy",
      "ripple",
      "bumpy walls",
      "vibration",
      "ugly walls",
      "seam",
      "layer lines look bad",
    ],
  },
  {
    category: "Nozzle / hotend leaks",
    terms: [
      "nozzle leak",
      "hotend leak",
      "leaking",
      "leak",
      "filament coming out the side",
      "seeping",
      "plastic around the nozzle",
      "blob on hotend",
      "heater block",
      "ptfe",
      "thread sealant",
    ],
  },
  {
    category: "Bed leveling drift",
    terms: [
      "level",
      "leveling",
      "levelling",
      "tramming",
      "z offset",
      "z-offset",
      "bed mesh",
      "abl",
      "auto bed level",
      "bed drift",
      "nozzle too close",
      "nozzle too far",
    ],
  },
  {
    category: "Dual-extruder issues",
    terms: [
      "dual extruder",
      "dual-extruder",
      "second extruder",
      "two nozzles",
      "left extruder",
      "right extruder",
      "extruder offset",
      "purge tower",
      "prime tower",
      "ooze shield",
      "tool change",
    ],
  },
  {
    category: "Enclosure / chamber issues",
    terms: [
      "enclosure",
      "chamber",
      "chamber temp",
      "ambient temp",
      "door open",
      "lid",
      "humidity",
      "ventilation",
      "fumes",
      "overheating chamber",
      "too hot inside",
    ],
  },
];

/**
 * Returns the best-matching category for a free-typed question, or "Other".
 * Scoring: number of distinct matching terms, tie-broken by longest match.
 */
export function categorizeChatQuestion(question: string): ChatTopicCategory {
  const text = question.toLowerCase();
  if (!text.trim()) return "Other";

  let best: { category: ChatTopicCategory; hits: number; length: number } | null = null;

  for (const { category, terms } of KEYWORDS) {
    let hits = 0;
    let length = 0;
    for (const term of terms) {
      if (text.includes(term)) {
        hits += 1;
        length = Math.max(length, term.length);
      }
    }
    if (hits === 0) continue;
    if (
      !best ||
      hits > best.hits ||
      (hits === best.hits && length > best.length)
    ) {
      best = { category, hits, length };
    }
  }

  return best ? best.category : "Other";
}
