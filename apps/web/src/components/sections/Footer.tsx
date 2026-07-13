import { Wordmark } from "@/components/brand/Wordmark";
import { DISCLAIMER } from "@/lib/config";

export function Footer() {
  return (
    <footer className="on-housing mt-auto bg-housing">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Wordmark tone="glow" />
          <p className="mt-2 font-mono text-xs text-glow/70">Oral intelligence, openly reported</p>
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
