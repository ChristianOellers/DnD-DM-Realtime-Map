import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { FateRollResult } from "@/lib/game/types";

const fateInput = z.object({
  sessionId: z.string().uuid(),
  prompt: z.string().trim().max(200).default(""),
});

/**
 * GM-only magical dice roll. Authorization is enforced here on the server
 * (and again by RLS when the resulting card is persisted) — never by hiding UI.
 */
export const rollFateDice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => fateInput.parse(input))
  .handler(async ({ data, context }): Promise<FateRollResult> => {
    const { supabase, userId } = context;

    const { data: session, error } = await supabase
      .from("game_sessions")
      .select("id, gm_user_id")
      .eq("id", data.sessionId)
      .single();

    if (error || !session) throw new Error("Session not found");
    if (session.gm_user_id !== userId) throw new Error("Only the Game Master may roll fate");

    const { data: chapter } = await supabase
      .from("story_chapters")
      .select("title")
      .eq("session_id", data.sessionId)
      .eq("is_active", true)
      .maybeSingle();

    const { resolveNarrator, rollCardDrafts } = await import("./mock-provider.server");

    const roll = 1 + Math.floor(Math.random() * 20);
    const magicalEvent = Math.random() < 0.5;

    if (!magicalEvent) {
      return { roll, narration: null, cards: [], provider: resolveNarrator().id };
    }

    const narrator = resolveNarrator();
    const narration = await narrator.narrate({
      prompt: data.prompt,
      roll,
      chapterTitle: chapter?.title ?? "Unknown Chapter",
    });

    return { roll, narration, cards: rollCardDrafts(), provider: narrator.id };
  });
