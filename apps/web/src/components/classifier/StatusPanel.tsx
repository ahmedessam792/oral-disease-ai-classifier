"use client";

import { CircleAlert, ScanLine } from "lucide-react";
import type { ApiClientError } from "@/lib/types";

interface StatusPanelProps {
  /** "result" never reaches this panel (ResultPanel renders instead), but the
   * parent's state union includes it. */
  phase: "empty" | "preview" | "loading" | "failed" | "result";
  error: ApiClientError | null;
  canAnalyze: boolean;
  onAnalyze: () => void;
  onReset: () => void;
}

const ERROR_TITLES: Record<ApiClientError["kind"], string> = {
  invalid_file: "That file can't be analyzed",
  model_unavailable: "The classification model isn't available yet",
  network: "Can't reach the analysis service",
  server: "Something went wrong",
};

export function StatusPanel({ phase, error, canAnalyze, onAnalyze, onReset }: StatusPanelProps) {
  return (
    <div className="flex flex-1 flex-col">
      <p className="font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-glow/70">
        Result chart
      </p>

      <div className="flex flex-1 flex-col justify-center gap-4 py-6">
        {phase === "empty" && !error && (
          <p className="text-sm leading-relaxed text-glow/60">
            When you analyze an image, the predicted class, confidence score,
            and full probability distribution will appear here.
          </p>
        )}

        {phase === "loading" && (
          <div className="flex items-center gap-3 text-glow" role="status">
            <ScanLine aria-hidden="true" size={20} strokeWidth={1.5} />
            <span className="analyzing-label">Analyzing image…</span>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-md border border-error/60 bg-error/10 p-4">
            <div className="flex items-start gap-3">
              <CircleAlert aria-hidden="true" size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-glow" />
              <div>
                <p className="font-medium text-glow">{ERROR_TITLES[error.kind]}</p>
                <p className="mt-1 text-sm leading-relaxed text-glow/70">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {phase === "failed" && (
          <button
            type="button"
            onClick={onReset}
            className="self-start rounded-md border border-glow/30 px-5 py-2.5 font-medium text-glow transition-colors hover:border-glow/70"
          >
            Choose another image
          </button>
        )}
      </div>

      {(phase === "preview" || phase === "loading") && (
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="w-full rounded-md bg-teal px-5 py-3 font-medium text-white transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {phase === "loading" ? "Analyzing…" : "Analyze image"}
        </button>
      )}
    </div>
  );
}
