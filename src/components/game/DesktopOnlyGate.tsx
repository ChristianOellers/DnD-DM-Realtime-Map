import { useEffect, useState, type ReactNode } from "react";
import { MonitorPlay } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MIN_DESKTOP_WIDTH } from "@/lib/game/constants";

/**
 * The table is built for desktop, but small screens may continue anyway as a
 * showcase: the console is then rendered scaled down inside a scrollable frame.
 */
export function DesktopOnlyGate({ children }: { children: ReactNode }) {
  const [wide, setWide] = useState(true);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${MIN_DESKTOP_WIDTH}px)`);
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!wide && !forced) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="panel max-w-sm p-8 text-center">
          <MonitorPlay className="mx-auto h-10 w-10 text-primary" aria-hidden />
          <h1 className="mt-4 text-xl ember-text">The table needs more room</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ashfall is designed as a desktop Game Master console. On a screen at least{" "}
            {MIN_DESKTOP_WIDTH}px wide everything fits — but you can still take a look here.
          </p>
          <Button className="mt-5 w-full" onClick={() => setForced(true)}>
            Enter anyway
          </Button>
        </div>
      </main>
    );
  }

  if (!wide) {
    return (
      <div className="w-screen overflow-x-auto">
        <div style={{ width: MIN_DESKTOP_WIDTH }}>{children}</div>
      </div>
    );
  }

  return <>{children}</>;
}
