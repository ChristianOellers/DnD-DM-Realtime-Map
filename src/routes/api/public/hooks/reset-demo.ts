import { createFileRoute } from "@tanstack/react-router";

/**
 * Hourly demo reset hook.
 *
 * Called by a scheduled job. Clears volatile demo data:
 *  - chat_messages: fully emptied
 *  - profiles: fully emptied
 *  - game_sessions: GM seat released (rows are kept, because maps, characters
 *    and story chapters reference them and the demo world would be destroyed)
 *
 * Secured by a shared secret in the `x-reset-secret` header.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const ALL_ROWS = "00000000-0000-0000-0000-000000000000";

export const Route = createFileRoute("/api/public/hooks/reset-demo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["DEMO_RESET_SECRET"];
        const provided = request.headers.get("x-reset-secret");

        if (!expected || !provided || !timingSafeEqual(provided, expected)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const chat = await supabaseAdmin.from("chat_messages").delete().neq("id", ALL_ROWS);
        const profiles = await supabaseAdmin.from("profiles").delete().neq("id", ALL_ROWS);
        const sessions = await supabaseAdmin
          .from("game_sessions")
          .update({ gm_user_id: null, gm_claimed_at: null })
          .neq("id", ALL_ROWS);

        const error = chat.error ?? profiles.error ?? sessions.error;
        if (error) {
          console.error("[reset-demo] failed", error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({ success: true, resetAt: new Date().toISOString() }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
