import { DISCLAIMER } from "@/lib/config";

export function Footer() {
  return (
    <footer className="on-housing mt-auto bg-housing">
      <div className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6">
        <p className="max-w-[70ch] text-sm leading-relaxed text-glow/80">
          <strong className="font-medium text-glow">Medical disclaimer.</strong>{" "}
          {DISCLAIMER} If you have concerns about your oral health, consult a
          dentist or physician.
        </p>
        <p className="mt-6 font-mono text-xs text-glow/40">
          oral-disease-ai-classifier · academic deep-learning project
        </p>
      </div>
    </footer>
  );
}
