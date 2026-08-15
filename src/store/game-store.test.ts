import { beforeEach, describe, expect, it } from "vitest";

import { useGameStore } from "./game-store";

const reset = () =>
  useGameStore.setState({
    activeMapKey: "world",
    gridStyle: "square",
    theme: "dark",
    offeredCards: [],
    claimedCardIndex: null,
    selectedCharacterId: null,
  });

describe("game ui store", () => {
  beforeEach(reset);

  it("cycles grid styles square -> hex -> none -> square", () => {
    const { cycleGridStyle } = useGameStore.getState();
    cycleGridStyle();
    expect(useGameStore.getState().gridStyle).toBe("hex");
    cycleGridStyle();
    expect(useGameStore.getState().gridStyle).toBe("none");
    cycleGridStyle();
    expect(useGameStore.getState().gridStyle).toBe("square");
  });

  it("claims a card from the current offer", () => {
    useGameStore
      .getState()
      .offerCards([
        { title: "Ember Ward", effect: "Blocks one blow.", icon: "shield", theme: "ember" },
      ]);
    const claimed = useGameStore.getState().claimCard(0);
    expect(claimed?.title).toBe("Ember Ward");
    expect(useGameStore.getState().claimedCardIndex).toBe(0);
  });

  it("switches the active map", () => {
    useGameStore.getState().setActiveMap("dungeon");
    expect(useGameStore.getState().activeMapKey).toBe("dungeon");
  });
});
