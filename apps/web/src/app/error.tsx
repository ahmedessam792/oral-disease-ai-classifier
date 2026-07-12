"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[1120px] flex-col items-start justify-center px-4 sm:px-6">
      <p className="eyebrow">Error</p>
      <h1 className="mt-3 font-display text-3xl text-ink">
        Something went wrong on this page
      </h1>
      <p className="mt-3 max-w-[52ch] leading-relaxed text-ink-soft">
        Nothing you uploaded was stored. Reload the page to continue.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-teal px-6 py-3 font-medium text-white transition-colors hover:bg-teal-deep"
      >
        Try again
      </button>
    </main>
  );
}
