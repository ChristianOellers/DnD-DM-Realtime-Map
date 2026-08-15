import type { CardDraft } from "@/lib/game/types";
import { CARD_THEMES } from "@/lib/game/constants";

/**
 * Replaceable AI provider layer.
 *
 * `mockNarrator` is the only implementation wired up today because no model
 * credentials are configured. `openAiCompatibleNarrator` shows the exact shape
 * a real provider must satisfy — swap the export in `resolveNarrator()` once a
 * key exists. Nothing in this module ever reaches the browser.
 */

export interface NarratorRequest {
  prompt: string;
  roll: number;
  chapterTitle: string;
}

export interface Narrator {
  readonly id: "mock" | "openai-compatible";
  narrate(request: NarratorRequest): Promise<string>;
}

const MOCK_NARRATIONS: readonly string[] = [
  "The dice come up warm. For three breaths every torch in the room burns without smoke, and the shadows they cast point the wrong way — all of them toward the stair going down.",
  "A voice answers the prayer before it is finished. It says a number, not a name, and the number is one lower than the last time anyone asked.",
  "Rain begins inside the corridor. It tastes of iron and falls upward for a moment before remembering itself. Where it strikes the wall, old lettering surfaces: SECTOR 12 — HABITATION.",
  "The Cartwright's mule refuses the road. Beneath the packed earth something long and straight runs east to west, humming at the edge of hearing, warm enough to melt the frost above it.",
  "Sela's censer gutters and relights nine times in perfect rhythm. On the ninth, a panel of the chapel wall sighs open a finger's width and cold, clean air comes out.",
  "A blessing lands on the whole party at once — the same words, spoken in four voices none of them own. Everyone gains a reroll. Everyone also loses one hour they cannot account for.",
  "The glass crater fills with light from below. For an instant the party sees the outline of a city beneath it, streets laid out in an impossible grid, and then only their own reflections.",
  "Morvane's diagram completes itself while he sleeps. The final rune is not a rune. It is a hand-drawn arrow labelled, in a workman's script, 'coolant — do not seal'.",
  "Something enormous turns over in the deep and every compass in the Marches swings to face it, then politely swings back. The floor is warmer than it was.",
  "The fate dice split cleanly in two. Inside is not stone but a wafer of grey glass, etched with lines finer than any engraver's tool could cut. It is still faintly warm.",
];

const CARD_TITLES: readonly string[] = [
  "The Stuttering Prayer",
  "Warm Stone",
  "Rust Bloom",
  "The Ninth Chime",
  "Ash-Lit Omen",
  "Grid of Saints",
  "The Merchant's Discount",
  "Coolant Rites",
  "A Door That Was Never Wood",
  "The Quiet Frequency",
  "Salt Communion",
  "Lamplight Without Flame",
];

const CARD_EFFECTS: readonly string[] = [
  "Once before the next long rest, a single roll may be taken twice. The second result arrives a heartbeat early.",
  "One character wakes knowing a word in no living tongue. They may use it once, to open something.",
  "The party's light source cannot be extinguished for an hour, and casts no shadow.",
  "An unfriendly creature hesitates for one round, staring past the party at something behind them.",
  "The next door the party finds is already unlocked, and was unlocked from the inside.",
  "One character's wounds close without scarring, leaving a faint grid pattern on the skin.",
  "All prices are halved for one encounter. The seller will not meet anyone's eyes.",
  "The GM reveals one true fact about the world that the players were not meant to learn yet.",
  "A map the party owns redraws itself overnight, and is now correct.",
  "For one scene, the party can hear a low hum and can tell, exactly, which direction is 'down' toward it.",
];

const CARD_ICONS: readonly string[] = [
  "sparkles",
  "flame",
  "gem",
  "compass",
  "scroll",
  "key",
  "eye",
  "zap",
  "moon",
  "shield",
];

function pick<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)]!;
}

/** Three distinct, harmonious card drafts for a single magical event. */
export function rollCardDrafts(random: () => number = Math.random): CardDraft[] {
  const titles = new Set<string>();
  while (titles.size < 3) titles.add(pick(CARD_TITLES, random));
  return [...titles].map((title) => ({
    title,
    effect: pick(CARD_EFFECTS, random),
    icon: pick(CARD_ICONS, random),
    theme: pick(CARD_THEMES, random),
  }));
}

export const mockNarrator: Narrator = {
  id: "mock",
  async narrate({ prompt, roll }) {
    const base = pick(MOCK_NARRATIONS, Math.random);
    const omen = roll >= 18 ? " The omen is strong." : roll <= 3 ? " The omen is sour." : "";
    const echo = prompt ? ` (The Marches answer: “${prompt}”.)` : "";
    return `${base}${omen}${echo}`;
  },
};

/**
 * Drop-in real provider. Enable by returning it from `resolveNarrator()` once
 * an OPENAI_COMPATIBLE_API_KEY / _BASE_URL pair is configured server-side.
 * The key is read inside the call so it never leaves the server boundary.
 */
export const openAiCompatibleNarrator: Narrator = {
  id: "openai-compatible",
  async narrate({ prompt, roll, chapterTitle }) {
    const apiKey = process.env["OPENAI_COMPATIBLE_API_KEY"];
    const baseUrl = process.env["OPENAI_COMPATIBLE_BASE_URL"];
    const model = process.env["OPENAI_COMPATIBLE_MODEL"] ?? "gpt-4o-mini";
    if (!apiKey || !baseUrl) throw new Error("AI provider is not configured");

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You narrate short, eerie D&D events for a world that looks medieval but is secretly post-apocalyptic. Two or three sentences. Never explain the twist outright.",
          },
          { role: "user", content: `Chapter: ${chapterTitle}. Fate die: ${roll}. ${prompt}` },
        ],
      }),
    });
    if (!response.ok) throw new Error("AI provider request failed");
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("AI provider returned no content");
    return text;
  },
};

/** Single switch point between the mock and a real provider. */
export function resolveNarrator(): Narrator {
  return mockNarrator;
}
