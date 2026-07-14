import { TriangleAlert } from "lucide-react";

/** Shown whenever the API flags a response as coming from the development
 * mock. Real deployments never show this because production refuses to run
 * the mock adapter. */
export function MockBanner() {
  return (
    <p
      data-testid="mock-banner"
      className="flex items-start gap-2 rounded-md border border-warn/70 bg-warn/20 px-3 py-2.5 font-mono text-caption leading-relaxed text-glow"
    >
      <TriangleAlert aria-hidden="true" size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
      Development mock — not a real classification result
    </p>
  );
}
