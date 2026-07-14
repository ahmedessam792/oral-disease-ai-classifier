"use client";

import { useEffect, useState } from "react";
import { barScale, formatProbability, sortedProbabilities } from "@/lib/report";

interface ProbabilityListProps {
  probabilities: Record<string, number>;
  predictedClass: string;
  /** "light" renders on the porcelain surfaces (the report drawer). */
  tone?: "housing" | "light";
}

export function ProbabilityList({
  probabilities,
  predictedClass,
  tone = "housing",
}: ProbabilityListProps) {
  // Bars grow from 0 after mount. scaleX, not width — no layout thrash.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const onHousing = tone === "housing";
  const entries = sortedProbabilities(probabilities);

  return (
    <ul role="list" className="flex flex-col gap-3" data-testid="probability-list">
      {entries.map(([label, probability], index) => {
        const isPredicted = label === predictedClass;
        return (
          <li key={label} className="print-keep text-sm">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span
                title={label}
                className={`min-w-0 truncate ${
                  isPredicted
                    ? onHousing
                      ? "font-medium text-glow"
                      : "font-medium text-ink"
                    : onHousing
                      ? "text-glow/75"
                      : "text-ink-soft"
                }`}
              >
                {label}
              </span>
              <span
                className={`shrink-0 font-mono text-xs tabular-nums ${
                  onHousing ? "text-glow/75" : "text-ink-soft"
                }`}
              >
                {formatProbability(probability)}
              </span>
            </div>
            <div
              aria-hidden="true"
              className={`print-bar h-1.5 overflow-hidden rounded-full ${
                onHousing ? "bg-glow/15" : "bg-line"
              }`}
            >
              <div
                className={`probability-bar h-full w-full rounded-full ${
                  isPredicted ? "bg-rose" : "bg-teal"
                }`}
                style={{
                  transform: `scaleX(${settled ? barScale(probability) : 0})`,
                  transitionDelay: `${index * 60}ms`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
