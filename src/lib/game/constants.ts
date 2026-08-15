/** Shared, non-secret constants for the demo session. */

/** The single shared demo session. All players join the same table. */
export const DEMO_SESSION_SLUG = "ashfall";

/** Radius, in grid cells, that a moved figure reveals around itself. */
export const REVEAL_RADIUS = 2.5;

/** Grid styles the GM can switch between. */
export const GRID_STYLES = ["square", "hex", "none"] as const;
export type GridStyle = (typeof GRID_STYLES)[number];

/** Card visual themes — kept harmonious with the design tokens. */
export const CARD_THEMES = ["ember", "arcane", "verdant", "relic", "gilded"] as const;
export type CardTheme = (typeof CARD_THEMES)[number];

export const CARD_THEME_TOKEN: Record<CardTheme, string> = {
  ember: "var(--ember)",
  arcane: "var(--arcane)",
  verdant: "var(--verdant)",
  relic: "var(--relic)",
  gilded: "var(--primary)",
};

/** localStorage key for the offline mutation queue. */
export const OFFLINE_QUEUE_KEY = "ashfall.offline-queue.v1";

/** Minimum viewport width the interface supports. */
export const MIN_DESKTOP_WIDTH = 1024;
