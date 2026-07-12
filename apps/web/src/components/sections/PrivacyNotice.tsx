export function PrivacyNotice() {
  return (
    <section
      aria-labelledby="privacy-heading"
      className="border-t border-line bg-surface"
    >
      <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 sm:py-20">
        <p className="eyebrow">Privacy</p>
        <h2 id="privacy-heading" className="mt-3 font-display text-3xl text-ink">
          Your image is examined, not kept
        </h2>
        <div className="mt-6 max-w-[62ch] space-y-4 leading-relaxed text-ink-soft">
          <p>
            Uploaded images are processed entirely in memory: validated,
            resized, classified, and immediately discarded. They are never
            written to disk, stored in a database, or logged.
          </p>
          <p>
            This site uses no analytics and no trackers. The only network
            request your image makes is the one you trigger with the Analyze
            button.
          </p>
          <p>
            Still, avoid uploading images that could identify a person if that
            concerns you — this is a student research project, not a certified
            medical system.
          </p>
        </div>
      </div>
    </section>
  );
}
