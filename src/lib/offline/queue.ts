import { OFFLINE_QUEUE_KEY } from "@/lib/game/constants";
import type { PositionInput, StoryInput } from "@/lib/game/mutations";

/**
 * A deliberately small offline layer: GM story edits and figure moves made
 * while offline are queued locally and replayed when connectivity returns.
 * Conflict rule is deterministic last-write-wins per target (map+character, or
 * chapter), which matches how the server stores those rows.
 */

export type QueuedOperation =
  | { kind: "position"; queuedAt: number; payload: PositionInput }
  | { kind: "story"; queuedAt: number; payload: StoryInput };

function targetKey(operation: QueuedOperation): string {
  return operation.kind === "position"
    ? `position:${operation.payload.mapId}:${operation.payload.characterId}`
    : `story:${operation.payload.chapterId}`;
}

/** Collapses superseded operations; keeps the newest write per target. */
export function collapse(operations: QueuedOperation[]): QueuedOperation[] {
  const latest = new Map<string, QueuedOperation>();
  for (const operation of operations) {
    const key = targetKey(operation);
    const existing = latest.get(key);
    if (!existing || existing.queuedAt <= operation.queuedAt) latest.set(key, operation);
  }
  return [...latest.values()].sort((a, b) => a.queuedAt - b.queuedAt);
}

function readStorage(): QueuedOperation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as QueuedOperation[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(operations: QueuedOperation[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(operations));
}

export function enqueue(operation: Omit<QueuedOperation, "queuedAt">): void {
  const next = collapse([...readStorage(), { ...operation, queuedAt: Date.now() } as QueuedOperation]);
  writeStorage(next);
}

export function pending(): QueuedOperation[] {
  return collapse(readStorage());
}

export function clearQueue(): void {
  writeStorage([]);
}

export interface FlushHandlers {
  position: (payload: PositionInput) => Promise<void>;
  story: (payload: StoryInput) => Promise<void>;
}

/** Replays the queue in order; keeps operations that still fail. */
export async function flush(handlers: FlushHandlers): Promise<number> {
  const operations = pending();
  const failed: QueuedOperation[] = [];
  let applied = 0;

  for (const operation of operations) {
    try {
      if (operation.kind === "position") await handlers.position(operation.payload);
      else await handlers.story(operation.payload);
      applied += 1;
    } catch {
      failed.push(operation);
    }
  }

  writeStorage(failed);
  return applied;
}
