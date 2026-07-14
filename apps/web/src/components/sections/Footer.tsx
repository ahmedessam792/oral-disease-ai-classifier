import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { DISCLAIMER } from "@/lib/config";

export function Footer() {
  return (
    <footer className="on-housing mt-auto bg-housing">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Wordmark tone="glow" />
          <p className="mt-2 font-mono text-xs text-glow/70">
            Oral image classification, openly reported
          </p>
          {/* Repository link slots in here once the repo is published. */}
          <nav aria-label="Footer" className="mt-4">
            <Link
              href="/about"
              className="text-sm text-glow/80 underline-offset-4 transition-colors hover:text-glow hover:underline"
            >
              About Arcus
            </Link>
          </nav>
        </div>

        <div className="max-w-[62ch]">
          <p className="text-sm leading-relaxed text-glow/80">
            <strong className="font-medium text-glow">Medical disclaimer.</strong>{" "}
            {DISCLAIMER} If you have concerns about your oral health, consult a
            dentist or physician.
          </p>
          <p className="mt-4 font-mono text-xs text-glow/70">
            oral-disease-ai-classifier · academic deep-learning project
          </p>
        </div>
      </div>
    </footer>
  );
}
