import { TriangleAlert } from "lucide-react";

/** Shown whenever the API flags a response as coming from the development
 * mock. Real deployments never show this because production refuses to run
 * the mock adapter. */
export function MockBanner() {
  return (
    <p
      data-testid="mock-banner"
      className="flex items-center gap-2 rounded-md border border-warn/70 bg-warn/15 px-3 py-2 font-mono text-xs text-glow"
    >
      <TriangleAlert aria-hidden="true" size={14} strokeWidth={2} className="shrink-0" />
      Development mock — not a real classification result
    </p>
  );
}
