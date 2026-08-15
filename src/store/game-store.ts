import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CardDraft, MapKey } from "@/lib/game/types";
import type { GridStyle } from "@/lib/game/constants";

/**
 * Zustand holds *client* state only. Server truth (characters, positions, fog,
 * story, chat) lives in the database and is cached by TanStack Query.
 */
export interface GameUiState {
  activeMapKey: MapKey;
  selectedCharacterId: string | null;
  gridStyle: GridStyle;
  /** GM may preview the players' fog-of-war view. */
  previewAsPlayer: boolean;
  theme: "dark" | "light";
  candleEnabled: boolean;
  /** Cards currently offered by a fate roll, awaiting the GM's pick. */
  offeredCards: CardDraft[];
  claimedCardIndex: number | null;

  setActiveMap: (key: MapKey) => void;
  selectCharacter: (id: string | null) => void;
  cycleGridStyle: () => void;
  setPreviewAsPlayer: (value: boolean) => void;
  toggleTheme: () => void;
  setCandleEnabled: (value: boolean) => void;
  offerCards: (cards: CardDraft[]) => void;
  claimCard: (index: number) => CardDraft | null;
  clearOfferedCards: () => void;
}

const GRID_ORDER: GridStyle[] = ["square", "hex", "none"];

export const useGameStore = create<GameUiState>()(
  persist(
    (set, get) => ({
      activeMapKey: "world",
      selectedCharacterId: null,
      gridStyle: "square",
      previewAsPlayer: false,
      theme: "dark",
      candleEnabled: true,
      offeredCards: [],
      claimedCardIndex: null,

      setActiveMap: (key) => set({ activeMapKey: key }),
      selectCharacter: (id) => set({ selectedCharacterId: id }),
      cycleGridStyle: () =>
        set((state) => ({
          gridStyle: GRID_ORDER[(GRID_ORDER.indexOf(state.gridStyle) + 1) % GRID_ORDER.length]!,
        })),
      setPreviewAsPlayer: (value) => set({ previewAsPlayer: value }),
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      setCandleEnabled: (value) => set({ candleEnabled: value }),
      offerCards: (cards) => set({ offeredCards: cards, claimedCardIndex: null }),
      claimCard: (index) => {
        const card = get().offeredCards[index];
        if (!card) return null;
        set({ claimedCardIndex: index });
        return card;
      },
      clearOfferedCards: () => set({ offeredCards: [], claimedCardIndex: null }),
    }),
    {
      name: "ashfall.ui.v1",
      partialize: (state) => ({
        activeMapKey: state.activeMapKey,
        gridStyle: state.gridStyle,
        theme: state.theme,
        candleEnabled: state.candleEnabled,
      }),
    },
  ),
);
