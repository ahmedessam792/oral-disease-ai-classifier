interface WordmarkProps {
  /** "ink" for light surfaces, "glow" for the dark housing. */
  tone?: "ink" | "glow";
}

/** Arcus — the mark is the dental arch (arcus dentalis) reduced to a stroked
 * arc with three measurement nodes: the instrument, not the anatomy. */
export function Wordmark({ tone = "ink" }: WordmarkProps) {
  const text = tone === "glow" ? "text-glow" : "text-ink";
  const accent = tone === "glow" ? "text-scan" : "text-teal";

  return (
    <span className={`flex items-center gap-2.5 ${text}`}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`h-6 w-6 shrink-0 ${accent}`}
        fill="none"
      >
        <path
          d="M3.5 18C3.5 10.8 7.3 5.5 12 5.5S20.5 10.8 20.5 18"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="12" cy="5.5" r="1.9" fill="currentColor" />
        <circle cx="3.5" cy="18" r="1.5" fill="currentColor" opacity="0.55" />
        <circle cx="20.5" cy="18" r="1.5" fill="currentColor" opacity="0.55" />
      </svg>
      {/* Pinned to the display face and an explicit optical size: the wordmark
          is a mark, not body copy, and must not drift with the UI scale. */}
      <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.015em]">
        Arcus
      </span>
    </span>
  );
}
