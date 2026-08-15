import { useEffect, useState, type ReactNode } from "react";
import { MonitorPlay } from "lucide-react";

import { MIN_DESKTOP_WIDTH } from "@/lib/game/constants";

/** The table is desktop-only by design; smaller viewports get a clear notice. */
export function DesktopOnlyGate({ children }: { children: ReactNode }) {
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${MIN_DESKTOP_WIDTH}px)`);
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!wide) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="panel max-w-sm p-8 text-center">
          <MonitorPlay className="mx-auto h-10 w-10 text-primary" aria-hidden />
          <h1 className="mt-4 text-xl ember-text">The table needs more room</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ashfall is a desktop-only Game Master console. Open it on a screen at least{" "}
            {MIN_DESKTOP_WIDTH}px wide to take your seat.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
