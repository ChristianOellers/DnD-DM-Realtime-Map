import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { DEMO_SESSION_SLUG } from "./constants";
import type {
  ChatMessage,
  CharacterPosition,
  CharacterSheet,
  FogCell,
  GameMap,
  GameSession,
  MagicCard,
  StoryChapter,
} from "./types";

/** Reads run through the browser Supabase client, so RLS applies as the user. */

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("Not found");
  return result.data;
}

export async function fetchSession(): Promise<GameSession> {
  return unwrap(
    await supabase.from("game_sessions").select("*").eq("slug", DEMO_SESSION_SLUG).single(),
  );
}

export async function fetchMaps(sessionId: string): Promise<GameMap[]> {
  return unwrap(
    await supabase.from("maps").select("*").eq("session_id", sessionId).order("sort_order"),
  );
}

export async function fetchCharacters(sessionId: string): Promise<CharacterSheet[]> {
  const rows = unwrap(
    await supabase
      .from("characters")
      .select("*, items(*), effects(*)")
      .eq("session_id", sessionId)
      .order("is_npc")
      .order("name"),
  );
  return rows as CharacterSheet[];
}

export async function fetchPositions(mapId: string): Promise<CharacterPosition[]> {
  return unwrap(await supabase.from("character_positions").select("*").eq("map_id", mapId));
}

export async function fetchFog(mapId: string): Promise<FogCell[]> {
  return unwrap(await supabase.from("fog_cells").select("*").eq("map_id", mapId));
}

export async function fetchChapters(sessionId: string): Promise<StoryChapter[]> {
  return unwrap(
    await supabase
      .from("story_chapters")
      .select("*")
      .eq("session_id", sessionId)
      .order("chapter_number"),
  );
}

export async function fetchCards(sessionId: string): Promise<MagicCard[]> {
  return unwrap(
    await supabase
      .from("cards")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false }),
  );
}

// NOTE TO SELF: chat is intentionally DISABLED for the demo (compliance /
// security / PII risk); the chat_messages table grants are revoked, so this
// returns an empty list instead of querying. Original query kept commented
// out below — this disabling is OK and desired.
export async function fetchChat(_sessionId: string): Promise<ChatMessage[]> {
  return [];
  // return unwrap(
  //   await supabase
  //     .from("chat_messages")
  //     .select("*")
  //     .eq("session_id", sessionId)
  //     .order("created_at")
  //     .limit(200),
  // );
}

export const gameKeys = {
  session: ["session"] as const,
  maps: (sessionId: string) => ["maps", sessionId] as const,
  characters: (sessionId: string) => ["characters", sessionId] as const,
  positions: (mapId: string) => ["positions", mapId] as const,
  fog: (mapId: string) => ["fog", mapId] as const,
  chapters: (sessionId: string) => ["chapters", sessionId] as const,
  cards: (sessionId: string) => ["cards", sessionId] as const,
  chat: (sessionId: string) => ["chat", sessionId] as const,
};

export const sessionQuery = () =>
  queryOptions({ queryKey: gameKeys.session, queryFn: fetchSession });

export const mapsQuery = (sessionId: string) =>
  queryOptions({ queryKey: gameKeys.maps(sessionId), queryFn: () => fetchMaps(sessionId) });

export const charactersQuery = (sessionId: string) =>
  queryOptions({
    queryKey: gameKeys.characters(sessionId),
    queryFn: () => fetchCharacters(sessionId),
  });

export const positionsQuery = (mapId: string) =>
  queryOptions({ queryKey: gameKeys.positions(mapId), queryFn: () => fetchPositions(mapId) });

export const fogQuery = (mapId: string) =>
  queryOptions({ queryKey: gameKeys.fog(mapId), queryFn: () => fetchFog(mapId) });

export const chaptersQuery = (sessionId: string) =>
  queryOptions({ queryKey: gameKeys.chapters(sessionId), queryFn: () => fetchChapters(sessionId) });

export const cardsQuery = (sessionId: string) =>
  queryOptions({ queryKey: gameKeys.cards(sessionId), queryFn: () => fetchCards(sessionId) });

export const chatQuery = (sessionId: string) =>
  queryOptions({ queryKey: gameKeys.chat(sessionId), queryFn: () => fetchChat(sessionId) });
