"use client";

import { CircleAlert, RotateCcw, ScanLine } from "lucide-react";
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

const PIPELINE = ["Validate", "Preprocess", "Classify"];

/** A ghost of the report to come: shows the shape of the answer before there
 * is one, so the panel reads as "ready" rather than as empty space. */
function ReportGhost({ active }: { active: boolean }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div
          className={`h-[72px] w-[72px] shrink-0 rounded-full border-[6px] transition-colors duration-300 ${
            active ? "border-scan/30" : "border-glow/10"
          }`}
        />
        <div className="flex flex-1 flex-col gap-2">
          <div
            className={`h-3.5 rounded transition-colors duration-300 ${
              active ? "w-3/4 bg-scan/25" : "w-2/3 bg-glow/10"
            }`}
          />
          <div className="h-2.5 w-1/2 rounded bg-glow/10" />
        </div>
      </div>
      <div className="mt-1 flex flex-col gap-2.5">
        {[0.72, 0.54, 0.36, 0.22].map((width, index) => (
          <div key={width} className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <div
                className="h-2.5 rounded bg-glow/10"
                style={{ width: `${38 - index * 4}%` }}
              />
              <div className="h-2.5 w-8 rounded bg-glow/10" />
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-glow/10">
              <div
                className={`h-full rounded-full transition-colors duration-300 ${
                  active ? "bg-scan/25" : "bg-glow/[0.07]"
                }`}
                style={{ width: `${width * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusPanel({ phase, error, canAnalyze, onAnalyze, onReset }: StatusPanelProps) {
  const showGhost = (phase === "empty" || phase === "preview") && !error;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-caption font-medium uppercase tracking-[0.16em] text-glow/70">
          Report
        </p>
        {phase === "preview" && (
          <p className="font-mono text-caption text-scan">ready</p>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5">
        {showGhost && (
          <>
            <ReportGhost active={phase === "preview"} />
            <p className="text-xs leading-relaxed text-glow/75">
              {phase === "preview"
                ? "Your image is loaded. Run the analysis to see the predicted class, its confidence, and every probability the model assigned."
                : "The predicted class, confidence score, and full probability distribution appear here once you analyze an image."}
            </p>
          </>
        )}

        {phase === "loading" && (
          <div role="status" className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-glow">
              <ScanLine aria-hidden="true" size={20} strokeWidth={1.5} className="text-scan" />
              <span className="analyzing-label font-medium">Analyzing image…</span>
            </div>
            <ul className="flex flex-col gap-2.5">
              {PIPELINE.map((step) => (
                <li key={step} className="flex items-center gap-2.5 font-mono text-xs text-glow/75">
                  <span className="h-1.5 w-1.5 rounded-full bg-scan" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-error/60 bg-error/15 p-4">
            <div className="flex items-start gap-3">
              <CircleAlert
                aria-hidden="true"
                size={20}
                strokeWidth={1.75}
                className="mt-0.5 shrink-0 text-glow"
              />
              <div className="min-w-0">
                <p className="font-medium text-glow">{ERROR_TITLES[error.kind]}</p>
                <p className="mt-1 text-sm leading-relaxed text-glow/80">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {phase === "failed" && (
          <button
            type="button"
            onClick={onReset}
            className="flex h-11 cursor-pointer items-center gap-2 self-start rounded-md border border-glow/30 px-4 text-sm font-medium text-glow transition-colors duration-200 hover:border-glow/70 hover:bg-white/5"
          >
            <RotateCcw aria-hidden="true" size={15} strokeWidth={1.75} />
            Choose another image
          </button>
        )}
      </div>

      {(phase === "preview" || phase === "loading") && (
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="flex h-12 w-full shrink-0 cursor-pointer items-center justify-center rounded-md bg-teal px-4 font-medium text-white transition-colors duration-200 hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {phase === "loading" ? "Analyzing…" : "Analyze image"}
        </button>
      )}
    </div>
  );
}
