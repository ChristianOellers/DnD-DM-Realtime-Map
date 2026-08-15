import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearQueue, collapse, enqueue, flush, pending, type QueuedOperation } from "./queue";

const position = (characterId: string, x: number, queuedAt: number): QueuedOperation => ({
  kind: "position",
  queuedAt,
  payload: { mapId: "11111111-1111-4111-8111-111111111111", characterId, x, y: 2, onMap: true },
});

describe("offline queue", () => {
  beforeEach(() => {
    clearQueue();
  });

  it("keeps only the newest write per target (last-write-wins)", () => {
    const collapsed = collapse([position("a", 1, 10), position("a", 5, 20), position("b", 3, 15)]);
    expect(collapsed).toHaveLength(2);
    const forA = collapsed.find((op) => op.kind === "position" && op.payload.characterId === "a");
    expect(forA?.kind === "position" ? forA.payload.x : null).toBe(5);
  });

  it("persists queued operations across reads", () => {
    enqueue({ kind: "position", payload: position("a", 4, 0).payload });
    expect(pending()).toHaveLength(1);
  });

  it("replays operations and retains the ones that fail", async () => {
    enqueue({ kind: "position", payload: position("a", 4, 0).payload });
    enqueue({ kind: "position", payload: position("b", 6, 0).payload });

    const story = vi.fn();
    const positionHandler = vi.fn(async (payload: { characterId: string }) => {
      if (payload.characterId === "b") throw new Error("network down");
    });

    const applied = await flush({ position: positionHandler, story });
    expect(applied).toBe(1);
    expect(pending()).toHaveLength(1);
    const remaining = pending()[0];
    expect(remaining?.kind === "position" ? remaining.payload.characterId : null).toBe("b");
  });
});
