import { Crown, Eye, Flame, Grid3x3, LogOut, Moon, RefreshCw, Sun, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import type { GridStyle } from "@/lib/game/constants";
import type { GameMap, MapKey } from "@/lib/game/types";

interface TopBarProps {
  sessionName: string;
  maps: GameMap[];
  activeMapKey: MapKey;
  isGm: boolean;
  gmName: string | null;
  userName: string;
  online: boolean;
  pendingCount: number;
  gridStyle: GridStyle;
  candleEnabled: boolean;
  previewAsPlayer: boolean;
  theme: "dark" | "light";
  onSelectMap: (key: MapKey) => void;
  onClaimGm: () => void;
  onCycleGrid: () => void;
  onToggleCandle: () => void;
  onTogglePreview: () => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
}

export function TopBar(props: TopBarProps) {
  return (
    <header className="panel flex items-center gap-4 px-4 py-2">
      <div className="min-w-0">
        <h1 className="truncate font-display text-base ember-text">{props.sessionName}</h1>
        <p className="text-[11px] text-muted-foreground">
          {props.isGm
            ? "You hold the Game Master's seat"
            : props.gmName
              ? `GM: ${props.gmName}`
              : "No Game Master seated"}
        </p>
      </div>

      <nav aria-label="Maps" className="flex gap-1 rounded-md border border-panel-border p-1">
        {props.maps.map((map) => (
          <button
            key={map.id}
            type="button"
            onClick={() => props.onSelectMap(map.key as MapKey)}
            aria-current={props.activeMapKey === map.key ? "page" : undefined}
            className="rounded-sm px-3 py-1 font-display text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-primary"
          >
            {map.name}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        {!props.online && (
          <span className="flex items-center gap-1.5 rounded-sm bg-destructive/15 px-2 py-1 text-[11px] text-destructive">
            <WifiOff className="h-3.5 w-3.5" aria-hidden />
            Offline
          </span>
        )}
        {props.pendingCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-sm bg-primary/15 px-2 py-1 text-[11px] text-primary">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            {props.pendingCount} pending
          </span>
        )}

        <Toggle
          pressed={props.gridStyle !== "none"}
          onPressedChange={props.onCycleGrid}
          aria-label={`Grid style: ${props.gridStyle}`}
        >
          <Grid3x3 className="h-4 w-4" aria-hidden />
        </Toggle>
        <Toggle
          pressed={props.candleEnabled}
          onPressedChange={props.onToggleCandle}
          aria-label="Candle light"
        >
          <Flame className="h-4 w-4" aria-hidden />
        </Toggle>
        {props.isGm && (
          <Toggle
            pressed={props.previewAsPlayer}
            onPressedChange={props.onTogglePreview}
            aria-label="Preview the players' view"
          >
            <Eye className="h-4 w-4" aria-hidden />
          </Toggle>
        )}
        <Toggle
          pressed={props.theme === "light"}
          onPressedChange={props.onToggleTheme}
          aria-label="Toggle light mode"
        >
          {props.theme === "dark" ? (
            <Moon className="h-4 w-4" aria-hidden />
          ) : (
            <Sun className="h-4 w-4" aria-hidden />
          )}
        </Toggle>

        {!props.isGm && (
          <Button type="button" onClick={props.onClaimGm} className="ml-1">
            <Crown className="h-4 w-4" aria-hidden />
            Take the GM Role
          </Button>
        )}

        <span className="ml-2 hidden text-xs text-muted-foreground xl:inline">
          {props.userName}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={props.onSignOut}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </header>
  );
}
