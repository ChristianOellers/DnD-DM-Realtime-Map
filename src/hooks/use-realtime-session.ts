import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { gameKeys } from "@/lib/game/queries";

/**
 * Realtime over Supabase's WebSocket channel (Phoenix protocol). Every
 * connected client of the session receives row changes and refreshes the
 * affected query — no polling anywhere in the app.
 */
export function useRealtimeSession(sessionId: string | undefined, mapIds: string[]): void {
  const queryClient = useQueryClient();
  const mapKey = mapIds.join(",");

  useEffect(() => {
    if (!sessionId) return;
    const ids = mapKey ? mapKey.split(",") : [];

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: gameKeys.chat(sessionId) }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cards", filter: `session_id=eq.${sessionId}` },
        () => queryClient.invalidateQueries({ queryKey: gameKeys.cards(sessionId) }),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "story_chapters",
          filter: `session_id=eq.${sessionId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: gameKeys.chapters(sessionId) }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` },
        () => queryClient.invalidateQueries({ queryKey: gameKeys.session }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "character_positions" },
        () => {
          for (const id of ids) queryClient.invalidateQueries({ queryKey: gameKeys.positions(id) });
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "fog_cells" }, () => {
        for (const id of ids) queryClient.invalidateQueries({ queryKey: gameKeys.fog(id) });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, mapKey, queryClient]);
}
