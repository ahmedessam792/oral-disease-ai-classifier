import { Wordmark } from "@/components/brand/Wordmark";
import { DISCLAIMER } from "@/lib/config";

/**
 * A hairline, not a slab. The footer used to be a full dark housing block,
 * which put a second dark mass on the page competing with the analyzer. There
 * is exactly one dark instrument here now, and it is the classifier.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        {/* No nav here: the header already owns navigation, and a second About
            link is a duplicated action, not a convenience. The repository link
            slots in beside the wordmark once the repo is published. */}
        <div className="flex items-center gap-4">
          <Wordmark />
          <p className="font-mono text-caption text-ink-faint">
            oral-disease-ai-classifier
          </p>
        </div>

        <p className="max-w-[62ch] text-caption text-ink-faint">{DISCLAIMER}</p>
      </div>
    </footer>
  );
}
