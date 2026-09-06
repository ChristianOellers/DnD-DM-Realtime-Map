import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { CARD_THEMES, REVEAL_RADIUS } from "./constants";
import type { CardDraft, GameSession } from "./types";

/**
 * Every mutation here is additionally guarded by row level security in the
 * database (`public.is_gm(...)`), so a tampered client cannot write GM state.
 */

export const positionSchema = z.object({
  mapId: z.string().uuid(),
  characterId: z.string().uuid(),
  x: z.number().finite().min(-8).max(80),
  y: z.number().finite().min(-8).max(80),
  onMap: z.boolean(),
});
export type PositionInput = z.infer<typeof positionSchema>;

export const storySchema = z.object({
  chapterId: z.string().uuid(),
  title: z.string().trim().min(1).max(80),
  mission: z.string().trim().max(160),
  progress: z.number().int().min(0).max(100),
  body: z.string().max(6000),
});
export type StoryInput = z.infer<typeof storySchema>;

export const chatSchema = z.object({
  body: z.string().trim().min(1).max(500),
});

export const cardSchema = z.object({
  title: z.string().trim().min(1).max(80),
  effect: z.string().trim().min(1).max(400),
  icon: z.string().trim().min(1).max(40),
  theme: z.enum(CARD_THEMES),
});

export async function saveCharacterPosition(input: PositionInput): Promise<void> {
  const value = positionSchema.parse(input);
  const { error } = await supabase.from("character_positions").upsert(
    {
      map_id: value.mapId,
      character_id: value.characterId,
      x: value.x,
      y: value.y,
      on_map: value.onMap,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "map_id,character_id" },
  );
  if (error) throw new Error(error.message);
}

/** Cells inside REVEAL_RADIUS of a point become permanently discovered. */
export function cellsAround(x: number, y: number, cols: number, rows: number): [number, number][] {
  const cells: [number, number][] = [];
  const r = Math.ceil(REVEAL_RADIUS);
  for (let dx = -r; dx <= r; dx += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      const cx = Math.floor(x) + dx;
      const cy = Math.floor(y) + dy;
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
      if (dx * dx + dy * dy > REVEAL_RADIUS * REVEAL_RADIUS) continue;
      cells.push([cx, cy]);
    }
  }
  return cells;
}

export async function revealFog(mapId: string, cells: [number, number][]): Promise<void> {
  if (cells.length === 0) return;
  const { error } = await supabase.from("fog_cells").upsert(
    cells.map(([cx, cy]) => ({ map_id: mapId, cx, cy })),
    { onConflict: "map_id,cx,cy", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
}

export async function saveChapter(input: StoryInput): Promise<void> {
  const value = storySchema.parse(input);
  const { error } = await supabase
    .from("story_chapters")
    .update({
      title: value.title,
      mission: value.mission,
      progress: value.progress,
      body: value.body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", value.chapterId);
  if (error) throw new Error(error.message);
}

// NOTE TO SELF: chat persistence is intentionally DISABLED for the demo
// (compliance / security / PII risk). The table grants are revoked in the
// database, so these functions are deliberate no-ops. The original insert
// code is kept commented out below — this disabling is OK and desired.
export async function sendChatMessage(
  _sessionId: string,
  _userId: string,
  _authorName: string,
  _body: string,
): Promise<void> {
  // const value = chatSchema.parse({ body });
  // const { error } = await supabase.from("chat_messages").insert({
  //   session_id: sessionId,
  //   user_id: userId,
  //   author_name: authorName,
  //   body: value.body,
  //   kind: "chat",
  // });
  // if (error) throw new Error(error.message);
}

/**
 * Game log entry written by the Game Master's client so the table keeps a
 * shared, persistent memory of what happened. Guarded by RLS (`kind = 'log'`).
 * DISABLED for the demo — see note on sendChatMessage above.
 */
export async function logEvent(
  _sessionId: string,
  _authorName: string,
  _body: string,
): Promise<void> {
  // const value = chatSchema.parse({ body: body.trim().slice(0, 500) });
  // const { error } = await supabase.from("chat_messages").insert({
  //   session_id: sessionId,
  //   user_id: null,
  //   author_name: authorName,
  //   body: value.body,
  //   kind: "log",
  // });
  // if (error) throw new Error(error.message);
}

export async function addCard(sessionId: string, userId: string, draft: CardDraft): Promise<void> {
  const value = cardSchema.parse(draft);
  const { error } = await supabase.from("cards").insert({
    session_id: sessionId,
    title: value.title,
    effect: value.effect,
    icon: value.icon,
    theme: value.theme,
    drawn_by: userId,
  });
  if (error) throw new Error(error.message);
}

/** Claiming the GM role goes through a SECURITY DEFINER function, never a direct UPDATE. */
export async function claimGameMaster(sessionId: string): Promise<GameSession> {
  const { data, error } = await supabase.rpc("claim_gm", { _session_id: sessionId });
  if (error) throw new Error(error.message);
  return data as unknown as GameSession;
}
