import { useEffect, useState } from "react";
import { BookOpen, Save, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import type { StoryChapter } from "@/lib/game/types";
import type { StoryInput } from "@/lib/game/mutations";

interface StoryPanelProps {
  chapters: StoryChapter[];
  isGm: boolean;
  online: boolean;
  saving: boolean;
  onSave: (input: StoryInput) => void;
}

export function StoryPanel({ chapters, isGm, online, saving, onSave }: StoryPanelProps) {
  const active = chapters.find((chapter) => chapter.is_active) ?? chapters[0];
  const [draft, setDraft] = useState<StoryInput | null>(null);

  useEffect(() => {
    if (!active) return;
    setDraft({
      chapterId: active.id,
      title: active.title,
      mission: active.mission,
      progress: active.progress,
      body: active.body,
    });
  }, [active?.id, active?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || !draft) return null;

  const dirty =
    draft.title !== active.title ||
    draft.mission !== active.mission ||
    draft.progress !== active.progress ||
    draft.body !== active.body;

  return (
    <section
      className="panel flex min-h-0 flex-col gap-3 overflow-hidden p-4"
      aria-labelledby="story-heading"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h2 id="story-heading" className="panel-heading flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          Chronicle
        </h2>
        <span className="font-display text-xs text-muted-foreground">
          Chapter {toRoman(active.chapter_number)}
        </span>
      </header>
      <div className="rule-ornament" />

      {isGm ? (
        <div className="flex min-h-0 flex-col gap-3">
          <div className="space-y-1">
            <Label htmlFor="chapter-title" className="panel-heading">
              Chapter title
            </Label>
            <Input
              id="chapter-title"
              value={draft.title}
              maxLength={80}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className="font-display"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="chapter-mission" className="panel-heading">
              Current mission
            </Label>
            <Input
              id="chapter-mission"
              value={draft.mission}
              maxLength={160}
              onChange={(event) => setDraft({ ...draft, mission: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="chapter-progress" className="panel-heading">
              Progress — {draft.progress}%
            </Label>
            <input
              id="chapter-progress"
              type="range"
              min={0}
              max={100}
              step={5}
              value={draft.progress}
              onChange={(event) => setDraft({ ...draft, progress: Number(event.target.value) })}
              className="w-full accent-[var(--ember)]"
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col space-y-1">
            <Label htmlFor="chapter-body" className="panel-heading">
              Story text
            </Label>
            <Textarea
              id="chapter-body"
              value={draft.body}
              maxLength={6000}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              className="min-h-40 flex-1 resize-none font-script text-sm leading-relaxed"
            />
          </div>
          <Button
            type="button"
            disabled={!dirty || saving}
            onClick={() => onSave(draft)}
            className="w-full"
          >
            {online ? (
              <Save className="h-4 w-4" aria-hidden />
            ) : (
              <WifiOff className="h-4 w-4" aria-hidden />
            )}
            {online ? "Save chronicle" : "Save offline (syncs later)"}
          </Button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-col gap-3">
          <h3 className="font-display text-lg ember-text">{active.title}</h3>
          <p className="text-sm text-muted-foreground">{active.mission}</p>
          <Progress value={active.progress} className="h-1.5" />
          <p className="min-h-0 flex-1 overflow-y-auto whitespace-pre-line font-script text-sm leading-relaxed text-foreground/85">
            {active.body}
          </p>
        </div>
      )}
    </section>
  );
}

const ROMAN: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(value: number): string {
  let remaining = value;
  let output = "";
  for (const [amount, symbol] of ROMAN) {
    while (remaining >= amount) {
      output += symbol;
      remaining -= amount;
    }
  }
  return output || "0";
}
