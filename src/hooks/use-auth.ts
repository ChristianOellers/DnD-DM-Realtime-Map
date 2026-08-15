import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

/**
 * Supabase issues a JWT-backed session; the access token is attached to every
 * server function call by the client middleware in `src/start.ts`.
 */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    void supabase.auth.getSession().then(({ data: current }) => {
      setSession(current.session);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function displayNameOf(user: User | null): string {
  if (!user) return "Wanderer";
  const meta = user.user_metadata as { display_name?: string; full_name?: string };
  return meta.display_name || meta.full_name || user.email?.split("@")[0] || "Wanderer";
}
