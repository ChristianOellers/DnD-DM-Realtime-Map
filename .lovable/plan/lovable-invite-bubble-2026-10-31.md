# Lovable invite bubble

Add the uploaded floating invite button to every page, styled to match the dark fantasy look.

## What changes
- New file `src/components/shared/LovableBubble.tsx` (moved from the upload).
- Rendered once in `src/routes/__root.tsx`, next to the `<Toaster />`, so it shows on every page.
- Nothing else changes.

## Behaviour (kept from the example)
- Small round button, fixed bottom-right, opens the invite link in a new tab.
- Hidden below `sm`, visible on tablet/desktop.
- Max z-index + `pointer-events-auto` so it stays clickable over map, HUD and dialogs.

## Styling adjustments
- Replace black border / white fill / hard black shadow with theme tokens: `bg-panel`, `border border-primary/60`, `shadow-emberglow`; heart uses `fill-primary` (or ember accent) instead of `fill-red-500`.
- Focus ring uses `outline-ring`; keep the hover scale/opacity.
- Remove the conflicting `relative -left-px -bottom-0.5` classes from the example (they would override `fixed`).
- No hardcoded colors, so it works in both light and dark theme.
