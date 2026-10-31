/**
 * LovableBubble — floating invite link, fixed bottom-right, hidden on mobile,
 * always on top and clickable above the game, HUD and dialogs.
 */
const INVITE_URL = "https://lovable.dev/invite/NZPTJTD";
const LABEL = "Try Lovable with +10 credits";

export function LovableBubble() {
  return (
    <a
      href={INVITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={LABEL}
      aria-label={LABEL}
      className="pointer-events-auto fixed bottom-4 right-4 z-[2147483647] hidden h-12 w-12 items-center justify-center rounded-full border border-primary/60 bg-panel shadow-emberglow transition-[transform,opacity] duration-200 ease-out hover:scale-[1.04] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="block h-6 w-6 rotate-45 fill-primary">
        <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
      </svg>
    </a>
  );
}
