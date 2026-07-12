"use client";

import type { PredictionResponse } from "@/lib/types";
import { DISCLAIMER } from "@/lib/config";
import { MockBanner } from "./MockBanner";
import { ProbabilityList } from "./ProbabilityList";

interface ResultPanelProps {
  result: PredictionResponse;
  onReset: () => void;
}

export function ResultPanel({ result, onReset }: ResultPanelProps) {
  const confidencePercent = (result.confidence * 100).toFixed(1);

  return (
    <div className="flex flex-1 flex-col gap-4" data-testid="result-panel">
      <p className="font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-glow/70">
        AI classification result
      </p>

      {result.mock && <MockBanner />}

      <div>
        <p className="font-display text-3xl text-glow">
          <span aria-hidden="true" className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-rose align-middle" />
          {result.predicted_class}
        </p>
        <p className="mt-2 font-mono text-sm text-glow/70">
          confidence {confidencePercent}%
        </p>
      </div>

      <ProbabilityList
        probabilities={result.probabilities}
        predictedClass={result.predicted_class}
      />

      <p className="font-mono text-xs text-glow/70">
        {result.model_name} · v{result.model_version}
      </p>

      <p className="text-xs leading-relaxed text-glow/75">{DISCLAIMER}</p>

      <button
        type="button"
        onClick={onReset}
        className="mt-auto w-full rounded-md border border-glow/30 px-5 py-3 font-medium text-glow transition-colors hover:border-glow/70"
      >
        Analyze another image
      </button>
    </div>
  );
}
