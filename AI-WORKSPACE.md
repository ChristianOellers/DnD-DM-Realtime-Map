# Ashfall — AI Workspace Knowledge

## What this is
A desktop-first (mobile-allowed-as-showcase) D&D Game Master console tech demo. Setting: the Ember Marches, a medieval-fantasy world that is slowly revealed to be a forgotten post-apocalyptic one.

## Stack & constraints
- TanStack Start v1 + TanStack Router + React 19 + Vite 7 + TypeScript strict.
- Backend: Lovable Cloud / Supabase PostgreSQL. No Prisma — edge worker has no TCP sockets; use typed Supabase client.
- Server logic: `createServerFn` from `@tanstack/react-start`. Public/webhook APIs go under `src/routes/api/public/*`.
- State: TanStack Query for server state, Zustand for UI state, Supabase Realtime for live sync, offline write queue for PWA demo.
- 3D map: Three.js with custom GLSL fragment shader; figures via `@dnd-kit/core` projected onto the board.
- Tests: Vitest. Run `bun run test`.

## Domain model
- `maps` (world / city / dungeon) hold grid dimensions.
- `characters` hold sheets; `character_positions` places them per map.
- `fog_cells` is persistent discovery.
- `story_chapters`, `cards`, `chat_messages` carry narrative and table chat.
- Property vs offer: a `property` is the world asset; a `listing` is the market offer. Here the equivalents are maps/characters vs the active session state.

## Auth & security
- **Auth is intentionally disabled for this demo.** Users enter only a display name; anonymous sessions are created behind the scenes. The original sign-in code is commented out, not deleted.
- GM authorization uses security-definer functions `is_gm(session)` and `claim_gm`. Only authenticated users can execute them; `claim_gm` checks the seat is free or already owned.
- All tables have RLS + GRANTs. GM-only writes are enforced server-side and by RLS, never by hidden UI.

## Design direction
- Dark atmospheric fantasy RPG (Diablo II-ish), OKLCH tokens in `src/styles.css`.
- Tailwind v4 CSS-first; no hardcoded colors in components.
- Fonts: Cinzel display, Alegreya Sans, Spectral.

## Demo caveats
- This is a tech demo, not production. Auth is bypassed, AI uses a deterministic mock provider, and offline mode is demonstrated but not hardened.
- Desktop is the intended form factor; mobile access is allowed as a showcase only.

## When modifying
- Keep server functions thin wrappers; move helpers out of `createServerFn` modules.
- Preserve the disabled sign-in code and the anonymous name-entry flow.
- Do not re-add authentication or production-grade auth flows without explicit user request.
- Maintain the dark fantasy visual language; avoid generic AI aesthetics.
