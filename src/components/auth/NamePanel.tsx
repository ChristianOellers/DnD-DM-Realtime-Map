import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * NOTE TO SELF (intentional, requested by the project owner):
 * Real sign-in / sign-up is deliberately DISABLED for this tech demo. The full
 * email + Google auth UI still lives in `SignInPanel.tsx` and can be restored
 * by swapping this component back out in `src/routes/index.tsx`.
 *
 * Everything downstream (RLS, server functions, realtime) still needs a JWT,
 * so we create an anonymous session and just store the player's chosen name.
 */
export function NamePanel() {
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  const enter = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const name = displayName.trim() || "Wanderer";
      const { error } = await supabase.auth.signInAnonymously({
        options: { data: { display_name: name } },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the table");
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="panel w-full max-w-md p-8">
        <p className="panel-heading">The Ashfall Compact</p>
        <h1 className="mt-2 font-display text-2xl ember-text">Take your seat at the table</h1>
        <p className="mt-2 font-script text-sm italic text-muted-foreground">
          The harvest came up grey. Someone must speak for the world tonight.
        </p>
        <div className="rule-ornament my-5" />

        <form className="space-y-3" onSubmit={enter}>
          <div className="space-y-1">
            <Label htmlFor="display-name">Name at the table</Label>
            <Input
              id="display-name"
              value={displayName}
              maxLength={40}
              autoFocus
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Wanderer"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogIn className="h-4 w-4" aria-hidden />
            )}
            Enter the table
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          No account needed — this is a public tech demo.
        </p>
      </div>
    </main>
  );
}
