import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { GameSession } from "./types";

const claimInput = z.object({ sessionId: z.string().uuid() });

/**
 * Claiming the Game Master seat. The privileged `claim_gm` routine is no longer
 * callable by signed-in users; it runs here with the verified caller id only.
 */
export const claimGameMasterSeat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => claimInput.parse(input))
  .handler(async ({ data, context }): Promise<GameSession> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: session, error } = await supabaseAdmin.rpc("claim_gm", {
      _session_id: data.sessionId,
      _user_id: userId,
    });

    if (error) throw new Error(error.message);
    return session as unknown as GameSession;
  });
