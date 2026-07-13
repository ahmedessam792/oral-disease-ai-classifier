"use client";

import { useEffect, useState } from "react";

interface ConfidenceRingProps {
  /** 0–1 */
  confidence: number;
}

const SIZE = 96;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Confidence as a calibrated dial. The numeric value stays in the DOM as text
 * (screen readers and tests read it); the ring is decorative reinforcement.
 */
export function ConfidenceRing({ confidence }: ConfidenceRingProps) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const percent = confidence * 100;
  const offset = settled ? CIRCUMFERENCE * (1 - confidence) : CIRCUMFERENCE;

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        aria-hidden="true"
        className="-rotate-90"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          className="text-glow/15"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          className="confidence-ring-track text-rose"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-medium text-glow">
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}
