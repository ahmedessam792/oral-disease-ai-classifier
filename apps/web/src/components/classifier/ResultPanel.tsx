"use client";

import { RotateCcw } from "lucide-react";
import type { PredictionResponse } from "@/lib/types";
import { DISCLAIMER } from "@/lib/config";
import { ConfidenceRing } from "./ConfidenceRing";
import { MockBanner } from "./MockBanner";
import { ProbabilityList } from "./ProbabilityList";

interface ResultPanelProps {
  result: PredictionResponse;
  onReset: () => void;
}

export function ResultPanel({ result, onReset }: ResultPanelProps) {
  const confidencePercent = (result.confidence * 100).toFixed(1);

  return (
    <div className="reveal flex flex-1 flex-col gap-5" data-testid="result-panel">
      <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-scan">
        AI classification result
      </p>

      {result.mock && <MockBanner />}

      {/* Primary result: the class, dialled against its confidence. */}
      <div className="flex items-center gap-4">
        <ConfidenceRing confidence={result.confidence} />
        <div className="min-w-0 flex-1">
          <p
            title={result.predicted_class}
            className="text-lg font-semibold leading-snug tracking-[-0.01em] text-glow [overflow-wrap:anywhere]"
          >
            {result.predicted_class}
          </p>
          <p className="mt-1.5 font-mono text-xs tabular-nums text-glow/75">
            confidence {confidencePercent}%
          </p>
        </div>
      </div>

      <hr className="border-glow/10" />

      {/* Supporting evidence */}
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-glow/70">
          All classes
        </p>
        <ProbabilityList
          probabilities={result.probabilities}
          predictedClass={result.predicted_class}
        />
      </div>

      {/* Limits and provenance */}
      <div className="mt-auto flex flex-col gap-3 border-t border-glow/10 pt-4">
        <p className="text-xs leading-relaxed text-glow/75">
          <span className="font-medium text-glow">Confidence is not certainty.</span>{" "}
          It reflects how similar this image looked to the model&apos;s training
          examples — not whether the classification is correct.
        </p>
        <p
          className="truncate font-mono text-[0.6875rem] text-glow/75"
          title={`${result.model_name} · v${result.model_version}`}
        >
          {result.model_name} · v{result.model_version}
        </p>
        <p className="text-xs leading-relaxed text-glow/75">{DISCLAIMER}</p>

        <button
          type="button"
          onClick={onReset}
          className="mt-1 flex h-12 w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-glow/30 px-4 text-sm font-medium text-glow transition-colors duration-200 hover:border-glow/70 hover:bg-white/5"
        >
          <RotateCcw aria-hidden="true" size={15} strokeWidth={1.75} />
          Analyze another image
        </button>
      </div>
    </div>
  );
}
