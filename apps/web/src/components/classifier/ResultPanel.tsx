"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, RotateCcw } from "lucide-react";
import type { ModelInfoResponse, PredictionResponse } from "@/lib/types";
import { DISCLAIMER } from "@/lib/config";
import { makeReportId, type AnalysisReport } from "@/lib/report";
import { ConfidenceRing } from "./ConfidenceRing";
import { MockBanner } from "./MockBanner";
import { ProbabilityList } from "./ProbabilityList";
import { ReportDrawer } from "./ReportDrawer";

interface ResultPanelProps {
  result: PredictionResponse;
  modelInfo: ModelInfoResponse | null;
  elapsedMs: number | null;
  analyzedAt: string | null;
  previewUrl: string | null;
  fileName: string | null;
  onReset: () => void;
}

export function ResultPanel({
  result,
  modelInfo,
  elapsedMs,
  analyzedAt,
  previewUrl,
  fileName,
  onReset,
}: ResultPanelProps) {
  const headingRef = useRef<HTMLParagraphElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Land the keyboard user on the answer they just asked for, instead of
  // dumping focus back to <body> when StatusPanel unmounts.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const timestamp = analyzedAt ?? new Date().toISOString();
  const report: AnalysisReport = useMemo(
    () => ({
      reportId: makeReportId(timestamp),
      analyzedAt: timestamp,
      result,
      modelInfo,
      elapsedMs,
      fileName,
    }),
    [timestamp, result, modelInfo, elapsedMs, fileName],
  );

  const provenance = [
    result.model_name,
    `v${result.model_version}`,
    modelInfo ? `${modelInfo.input_size.width}×${modelInfo.input_size.height}` : null,
    elapsedMs !== null ? `${elapsedMs} ms` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="reveal flex flex-1 flex-col gap-5" data-testid="result-panel">
      <p
        ref={headingRef}
        tabIndex={-1}
        className="font-mono text-caption font-medium uppercase tracking-[0.14em] text-scan outline-none"
      >
        AI classification result
      </p>

      {result.mock && <MockBanner />}

      <div className="flex items-center gap-4">
        <ConfidenceRing confidence={result.confidence} />
        <div className="min-w-0 flex-1">
          <p
            title={result.predicted_class}
            className="font-display text-h3 font-semibold text-glow [overflow-wrap:anywhere]"
          >
            {result.predicted_class}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-glow/75">
            Confidence, rounded down. It is not certainty.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-mono text-caption font-medium uppercase tracking-[0.14em] text-glow/70">
          All classes
        </p>
        <ProbabilityList
          probabilities={result.probabilities}
          predictedClass={result.predicted_class}
        />
      </div>

      {/* Provenance: promoted out of the legal block — it is the credibility. */}
      <div className="mt-auto flex flex-col gap-3 border-t border-glow/10 pt-4">
        {/* Wraps rather than truncates: this line is the credibility — the
            inference time must not be the part that gets cut off. */}
        <p
          className="font-mono text-caption leading-relaxed text-glow/75"
          title={provenance}
          data-testid="provenance"
        >
          {provenance}
        </p>

        <p className="text-xs leading-relaxed text-glow/75">{DISCLAIMER}</p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            ref={openButtonRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            data-testid="open-report"
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-teal px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-teal-deep"
          >
            <FileText aria-hidden="true" size={15} strokeWidth={1.75} />
            View full report
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-glow/30 px-4 text-sm font-medium text-glow transition-colors duration-200 hover:border-glow/70 hover:bg-white/5"
          >
            <RotateCcw aria-hidden="true" size={15} strokeWidth={1.75} />
            Analyze another
          </button>
        </div>
      </div>

      <ReportDrawer
        open={drawerOpen}
        report={report}
        previewUrl={previewUrl}
        onClose={() => {
          setDrawerOpen(false);
          openButtonRef.current?.focus();
        }}
        onReset={onReset}
      />
    </div>
  );
}
