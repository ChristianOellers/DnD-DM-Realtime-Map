# Ashfall — D&D Game Master Console

A desktop-only Game Master console for a tabletop session set in the Ember Marches:
a medieval fantasy world that is slowly revealed to be a forgotten post-apocalyptic
one, where the "chapel choir" hums on buried machinery and a "codex" is a manual.

Open `/` — sign in (email/password or Google), then take the GM role to unlock
editing, fate rolls and figure movement.

## Technology stack — where each requirement lives

| Requirement   | Implementation                                                                                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | TanStack Start + TanStack Router (`src/routes`), React 19, Vite                                                                                                                                                                              |
| Language      | TypeScript, strict, no `any` in app code                                                                                                                                                                                                     |
| Server logic  | `createServerFn` (`src/lib/ai/fate.functions.ts`)                                                                                                                                                                                            |
| Database      | Supabase PostgreSQL (Lovable Cloud), SQL migration with RLS + GRANTs                                                                                                                                                                         |
| ORM           | Prisma was evaluated and rejected — the deploy target is a Cloudflare-style edge worker with no TCP socket support. Data access uses the typed Supabase client with generated `Database` types, which gives the same end-to-end type safety. |
| Server state  | TanStack Query (`src/lib/game/queries.ts`)                                                                                                                                                                                                   |
| Client state  | Zustand + `persist` (`src/store/game-store.ts`)                                                                                                                                                                                              |
| 3D + shader   | Three.js scene with a custom GLSL fragment shader (`src/components/game/map-scene.ts`): procedural ash terrain, animated ember shimmer, fog-of-war mask and a mouse-following candle light                                                   |
| Drag & drop   | `@dnd-kit/core` figures projected onto the 3D board (`MapBoard.tsx`)                                                                                                                                                                         |
| Realtime      | Supabase Realtime (WebSockets) invalidating query caches (`use-realtime-session.ts`)                                                                                                                                                         |
| Offline / PWA | `public/manifest.webmanifest`, `public/sw.js` app-shell cache, and a write queue with last-write-wins collapsing (`src/lib/offline/queue.ts`)                                                                                                |
| AI            | Replaceable provider behind one interface (`src/lib/ai/mock-provider.server.ts`); a fate roll has ~50% chance to produce a narration plus three card drafts                                                                                  |
| Validation    | Zod schemas on every mutation input                                                                                                                                                                                                          |
| Styling       | Tailwind v4 CSS-first design system in `src/styles.css` (OKLCH tokens, CSS subgrid roster, container-relative typography)                                                                                                                    |
| Testing       | Vitest — `bun run test` (9 tests: offline queue semantics, D&D ability modifiers, fog reveal, UI store)                                                                                                                                      |

## Domain model

`properties of the world are separated from the offer on the table`:
`maps` (world / city / dungeon) hold grid dimensions; `characters` hold sheets;
`character_positions` is the per-map placement; `fog_cells` is persistent
discovery; `story_chapters`, `cards` and `chat_messages` carry the narrative.

## Security

- Row Level Security on every table, with `is_gm(session)` as the write gate.
- `claim_gm` is a security-definer function, so the GM seat cannot be stolen client-side.
- Server truth is never duplicated into Zustand; the store holds UI state only.

## Known limits

- Desktop only, by design — a gate blocks narrow viewports.
- The AI narrator runs on the deterministic mock provider; swapping in a real
  model means implementing the same provider interface.
- Offline mode queues GM story edits and figure moves; chat requires a connection.
