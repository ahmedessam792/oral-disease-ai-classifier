"use client";

import { useEffect, useState } from "react";

interface ProbabilityListProps {
  probabilities: Record<string, number>;
  predictedClass: string;
}

export function ProbabilityList({ probabilities, predictedClass }: ProbabilityListProps) {
  // Bars grow from 0 after mount (CSS transition, reduced-motion safe).
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const entries = Object.entries(probabilities).sort(([, a], [, b]) => b - a);

  return (
    <ul role="list" className="flex flex-col gap-3" data-testid="probability-list">
      {entries.map(([label, probability], index) => {
        const percent = probability * 100;
        const isPredicted = label === predictedClass;
        return (
          <li key={label} className="text-sm">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span
                title={label}
                className={`min-w-0 truncate ${
                  isPredicted ? "font-medium text-glow" : "text-glow/75"
                }`}
              >
                {label}
              </span>
              <span
                className={`shrink-0 font-mono text-xs tabular-nums ${
                  isPredicted ? "text-glow" : "text-glow/75"
                }`}
              >
                {percent.toFixed(1)}%
              </span>
            </div>
            <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-glow/15">
              <div
                className={`probability-bar h-full rounded-full ${
                  isPredicted ? "bg-rose" : "bg-teal"
                }`}
                style={{
                  width: settled ? `${percent}%` : "0%",
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
