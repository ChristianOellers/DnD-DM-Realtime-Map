import type { Tables } from "@/integrations/supabase/types";
import type { CardTheme } from "./constants";

export type GameSession = Tables<"game_sessions">;
export type GameMap = Tables<"maps">;
export type Character = Tables<"characters">;
export type Item = Tables<"items">;
export type Effect = Tables<"effects">;
export type CharacterPosition = Tables<"character_positions">;
export type FogCell = Tables<"fog_cells">;
export type StoryChapter = Tables<"story_chapters">;
export type MagicCard = Tables<"cards">;
export type ChatMessage = Tables<"chat_messages">;

export type MapKey = "world" | "city" | "dungeon";

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface CharacterSheet extends Character {
  items: Item[];
  effects: Effect[];
}

/** A candidate card offered by the fate roll; not yet persisted. */
export interface CardDraft {
  title: string;
  effect: string;
  icon: string;
  theme: CardTheme;
}

export interface FateRollResult {
  /** d20 result of the fate roll. */
  roll: number;
  /** Present on roughly half of the rolls — the "magical" narrative response. */
  narration: string | null;
  /** Always three harmonious card drafts when a narration was produced. */
  cards: CardDraft[];
  /** Which provider answered: the replaceable mock, or a real LLM. */
  provider: "mock" | "openai-compatible";
}

export function parseAbilityScores(value: unknown): AbilityScores {
  const source = (value ?? {}) as Partial<Record<keyof AbilityScores, unknown>>;
  const read = (key: keyof AbilityScores): number => {
    const raw = source[key];
    return typeof raw === "number" && Number.isFinite(raw) ? raw : 10;
  };
  return {
    str: read("str"),
    dex: read("dex"),
    con: read("con"),
    int: read("int"),
    wis: read("wis"),
    cha: read("cha"),
  };
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
