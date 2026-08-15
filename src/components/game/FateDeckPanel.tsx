import { useRef, useState } from "react";
import { Dices, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CARD_THEME_TOKEN, type CardTheme } from "@/lib/game/constants";
import type { CardDraft, FateRollResult, MagicCard } from "@/lib/game/types";
import { cardIcon } from "./card-icons";

interface FateDeckPanelProps {
  isGm: boolean;
  rolling: boolean;
  lastRoll: FateRollResult | null;
  offeredCards: CardDraft[];
  deck: MagicCard[];
  onRoll: (prompt: string) => void;
  onChooseCard: (card: CardDraft) => void;
}

export function FateDeckPanel({
  isGm,
  rolling,
  lastRoll,
  offeredCards,
  deck,
  onRoll,
  onChooseCard,
}: FateDeckPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [flyingIndex, setFlyingIndex] = useState<number | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const choose = (index: number) => {
    const card = offeredCards[index];
    if (!card || flyingIndex !== null) return;

    const cardElement = cardRefs.current[index];
    const deckElement = deckRef.current;
    if (cardElement && deckElement) {
      const from = cardElement.getBoundingClientRect();
      const to = deckElement.getBoundingClientRect();
      cardElement.style.setProperty(
        "--fly-x",
        `${to.left + to.width / 2 - (from.left + from.width / 2)}px`,
      );
      cardElement.style.setProperty(
        "--fly-y",
        `${to.top + to.height / 2 - (from.top + from.height / 2)}px`,
      );
    }
    setFlyingIndex(index);
    window.setTimeout(() => {
      setFlyingIndex(null);
      onChooseCard(card);
    }, 850);
  };

  return (
    <section className="panel flex flex-col gap-3 p-4" aria-labelledby="fate-heading">
      <header className="flex items-center justify-between">
        <h2 id="fate-heading" className="panel-heading flex items-center gap-2">
          <Dices className="h-3.5 w-3.5" aria-hidden />
          Fate &amp; the Deck
        </h2>
        <div
          ref={deckRef}
          className="relative flex h-10 w-8 items-center justify-center rounded-sm border border-panel-border bg-card"
          title={`${deck.length} cards in the deck`}
        >
          <span
            aria-hidden
            className="absolute inset-0 -rotate-6 rounded-sm border border-panel-border bg-card/70"
          />
          <span
            aria-hidden
            className="absolute inset-0 rotate-3 rounded-sm border border-panel-border bg-card/80"
          />
          <Layers className="relative h-4 w-4 text-primary" aria-hidden />
          <span className="absolute -bottom-2 -right-2 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
            {deck.length}
          </span>
        </div>
      </header>
      <div className="rule-ornament" />

      {isGm ? (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            onRoll(prompt.trim());
          }}
        >
          <Label htmlFor="fate-prompt" className="panel-heading">
            Optional omen prompt
          </Label>
          <Input
            id="fate-prompt"
            value={prompt}
            maxLength={200}
            placeholder="the crypt door opens…"
            onChange={(event) => setPrompt(event.target.value)}
          />
          <Button type="submit" disabled={rolling} className="w-full">
            <Dices className={`h-4 w-4 ${rolling ? "animate-spin" : ""}`} aria-hidden />
            {rolling ? "The dice are turning…" : "Roll the Fate Dice"}
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only the Game Master may roll fate. Watch the chronicle for what the Marches answer.
        </p>
      )}

      <div aria-live="polite" className="min-h-12 text-sm">
        {lastRoll && (
          <p className="font-script leading-relaxed text-foreground/85">
            <span className="ember-text font-display">d20 → {lastRoll.roll}.</span>{" "}
            {lastRoll.narration ?? "The dice fall silent. Nothing magical stirs this time."}
          </p>
        )}
      </div>

      {offeredCards.length > 0 && (
        <div>
          <p className="panel-heading mb-2">Choose the omen that comes to pass</p>
          <ul className="grid grid-cols-3 gap-2 [grid-template-rows:auto_1fr]">
            {offeredCards.map((card, index) => {
              const Icon = cardIcon(card.icon);
              const accent = CARD_THEME_TOKEN[card.theme as CardTheme] ?? "var(--ember)";
              return (
                <li key={card.title} className="grid grid-rows-subgrid row-span-2">
                  <button
                    type="button"
                    ref={(node) => {
                      cardRefs.current[index] = node;
                    }}
                    onClick={() => choose(index)}
                    className={`grid grid-rows-subgrid row-span-2 gap-2 rounded-md border p-3 text-left transition-transform hover:-translate-y-1 ${
                      flyingIndex === index ? "card-flying" : ""
                    }`}
                    style={{
                      borderColor: accent,
                      background: `linear-gradient(160deg, ${accent}22, var(--card))`,
                    }}
                  >
                    <span
                      className="flex items-center gap-2 font-display text-xs"
                      style={{ color: accent }}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {card.title}
                    </span>
                    <span className="text-[11px] leading-snug text-muted-foreground">
                      {card.effect}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {deck.length > 0 && (
        <div>
          <p className="panel-heading mb-2">Cards in play</p>
          <ul className="max-h-28 space-y-1 overflow-y-auto pr-1">
            {deck.slice(0, 12).map((card) => {
              const Icon = cardIcon(card.icon);
              const accent = CARD_THEME_TOKEN[card.theme as CardTheme] ?? "var(--ember)";
              return (
                <li key={card.id} className="flex items-start gap-2 text-xs">
                  <Icon className="mt-0.5 h-3 w-3 shrink-0" style={{ color: accent }} aria-hidden />
                  <span>
                    <span className="font-display">{card.title}</span>{" "}
                    <span className="text-muted-foreground">{card.effect}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
