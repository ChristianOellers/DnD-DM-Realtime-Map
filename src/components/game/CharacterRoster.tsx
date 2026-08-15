import { Heart, Shield } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { CharacterSheet } from "@/lib/game/types";

interface CharacterRosterProps {
  characters: CharacterSheet[];
  selectedId: string | null;
  offMapIds: Set<string>;
  onSelect: (id: string) => void;
}

/**
 * CSS Grid + Subgrid: the roster is a 3-row grid and every card spans those
 * rows as a subgrid, so names, vitals and effect chips stay aligned across
 * cards regardless of how long each character's data is.
 */
export function CharacterRoster({
  characters,
  selectedId,
  offMapIds,
  onSelect,
}: CharacterRosterProps) {
  return (
    <section aria-labelledby="roster-heading" className="panel p-4">
      <h2 id="roster-heading" className="panel-heading">
        The Compact
      </h2>
      <div className="rule-ornament my-3" />
      <ul className="grid grid-cols-3 gap-3 [grid-template-rows:auto_auto_auto]">
        {characters.map((character) => {
          const selected = character.id === selectedId;
          return (
            <li key={character.id} className="subgrid-rows gap-2">
              <button
                type="button"
                onClick={() => onSelect(character.id)}
                aria-pressed={selected}
                className="subgrid-rows w-full gap-2 rounded-md border border-panel-border bg-card/70 p-3 text-left transition-colors hover:border-primary/60 focus-visible:border-primary aria-pressed:border-primary aria-pressed:bg-accent/50"
                style={selected ? { boxShadow: "var(--shadow-emberglow)" } : undefined}
              >
                <span className="flex items-start justify-between gap-2">
                  <span>
                    <span
                      className="block font-display text-sm leading-tight"
                      style={{ color: character.accent_color }}
                    >
                      {character.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {character.archetype} · Lv {character.level}
                    </span>
                  </span>
                  {offMapIds.has(character.id) && (
                    <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Off map
                    </span>
                  )}
                </span>

                <span className="block space-y-1">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Heart className="h-3 w-3 text-destructive" aria-hidden />
                    {character.hp}/{character.max_hp}
                    <Shield className="ml-2 h-3 w-3 text-primary" aria-hidden />
                    AC {character.armor_class}
                  </span>
                  <Progress value={(character.hp / character.max_hp) * 100} className="h-1" />
                </span>

                <span className="flex flex-wrap gap-1">
                  {character.effects.slice(0, 3).map((effect) => (
                    <span
                      key={effect.id}
                      className={`rounded-sm px-1.5 py-0.5 text-[10px] tracking-wide ${
                        effect.kind === "buff"
                          ? "bg-verdant/15 text-verdant"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {effect.name}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
