import { Heart, Shield, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { abilityModifier, parseAbilityScores, type CharacterSheet } from "@/lib/game/types";

const RARITY_TOKEN: Record<string, string> = {
  common: "var(--muted-foreground)",
  uncommon: "var(--verdant)",
  rare: "var(--arcane)",
  epic: "var(--primary)",
  relic: "var(--relic)",
};

interface CharacterSheetDialogProps {
  character: CharacterSheet | null;
  onClose: () => void;
}

export function CharacterSheetDialog({ character, onClose }: CharacterSheetDialogProps) {
  const scores = parseAbilityScores(character?.stats);

  return (
    <Dialog open={Boolean(character)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl border-panel-border bg-panel">
        {character && (
          <>
            <DialogHeader>
              <DialogTitle
                className="font-display text-2xl"
                style={{ color: character.accent_color }}
              >
                {character.name}
              </DialogTitle>
              <DialogDescription className="font-script text-sm italic">
                {character.title || character.archetype} — {character.archetype}, level{" "}
                {character.level}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-[9rem_1fr] gap-5">
              <div className="space-y-3">
                <div
                  aria-hidden
                  className="flex h-36 items-end justify-center rounded-md border border-panel-border"
                  style={{
                    background: `radial-gradient(80% 70% at 50% 20%, ${character.accent_color}44, transparent 70%), var(--card)`,
                  }}
                >
                  <div
                    className="mb-4 h-20 w-10 rounded-t-full"
                    style={{
                      background: `linear-gradient(180deg, ${character.accent_color}, oklch(0.25 0.02 62))`,
                      boxShadow: `0 0 26px -8px ${character.accent_color}`,
                    }}
                  />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-destructive" aria-hidden />
                    {character.hp} / {character.max_hp} hit points
                  </p>
                  <Progress value={(character.hp / character.max_hp) * 100} className="h-1.5" />
                  <p className="flex items-center gap-2 pt-1">
                    <Shield className="h-3.5 w-3.5 text-primary" aria-hidden />
                    Armour class {character.armor_class}
                  </p>
                </div>
                <dl className="grid grid-cols-3 gap-1 text-center">
                  {Object.entries(scores).map(([key, value]) => (
                    <div key={key} className="rounded-sm border border-panel-border bg-card/60 py-1">
                      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {key}
                      </dt>
                      <dd className="font-display text-sm">
                        {value}
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          {abilityModifier(value) >= 0 ? "+" : ""}
                          {abilityModifier(value)}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="min-w-0 space-y-4">
                <section>
                  <h3 className="panel-heading">Inventory</h3>
                  <ul className="mt-2 grid grid-cols-2 gap-2">
                    {character.items.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-md border border-panel-border bg-card/60 p-2"
                      >
                        <span
                          className="flex items-center gap-2 font-display text-xs"
                          style={{ color: RARITY_TOKEN[item.rarity] }}
                        >
                          <span
                            aria-hidden
                            className="inline-block h-6 w-6 shrink-0 rounded-sm border border-panel-border"
                            style={{
                              background: `linear-gradient(135deg, ${RARITY_TOKEN[item.rarity]}55, transparent)`,
                            }}
                          />
                          {item.name}
                          {item.quantity > 1 && (
                            <span className="text-muted-foreground">×{item.quantity}</span>
                          )}
                        </span>
                        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                          {item.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="panel-heading">Buffs &amp; afflictions</h3>
                  <ul className="mt-2 space-y-1">
                    {character.effects.length === 0 && (
                      <li className="text-xs text-muted-foreground">None active.</li>
                    )}
                    {character.effects.map((effect) => (
                      <li key={effect.id} className="flex items-start gap-2 text-xs">
                        <Sparkles
                          className={`mt-0.5 h-3 w-3 shrink-0 ${
                            effect.kind === "buff" ? "text-verdant" : "text-destructive"
                          }`}
                          aria-hidden
                        />
                        <span>
                          <span className="font-display">{effect.name}</span>{" "}
                          <span className="text-muted-foreground">
                            ({effect.rounds_left} rounds) — {effect.description}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="panel-heading">Game Master notes</h3>
                  <p className="mt-2 font-script text-sm italic text-foreground/80">
                    {character.notes || "No notes recorded."}
                  </p>
                </section>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
