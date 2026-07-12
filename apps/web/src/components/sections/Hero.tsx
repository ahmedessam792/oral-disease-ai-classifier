export function Hero() {
  return (
    <section className="mx-auto max-w-[1120px] px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
      <p className="eyebrow">Oral diagnostic imaging · educational system</p>
      <h1 className="mt-5 max-w-[16ch] font-display text-4xl leading-[1.08] tracking-[-0.01em] text-ink sm:text-6xl">
        Every oral image deserves a careful reading.
      </h1>
      <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-soft">
        Upload a photograph of teeth, gums, or oral tissue. A deep-learning
        model classifies it and reports its confidence — openly, including the
        probabilities it assigned to every class it knows.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <a
          href="#classifier"
          className="rounded-md bg-teal px-6 py-3 font-medium text-white transition-colors hover:bg-teal-deep"
        >
          Analyze an image
        </a>
        <p className="max-w-[36ch] text-sm text-ink-soft">
          Educational and research use only — not medical advice.
        </p>
      </div>
    </section>
  );
}
