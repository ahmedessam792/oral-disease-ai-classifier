"use client";

import { useEffect, useState } from "react";
import { displayConfidence } from "@/lib/report";

interface ConfidenceRingProps {
  /** 0–1 */
  confidence: number;
  size?: number;
}

const STROKE = 7;

/**
 * Confidence as a calibrated dial. The value is rounded DOWN — a 99.9% result
 * must never render as "100%". This is the only place the number is shown in
 * the primary block, so there is never a second, disagreeing figure beside it.
 */
export function ConfidenceRing({ confidence, size = 92 }: ConfidenceRingProps) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = settled ? circumference * (1 - confidence) : circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        aria-hidden="true"
        className="-rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-glow/15"
          strokeWidth={STROKE}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="confidence-ring-track text-rose"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-medium tabular-nums text-glow">
        {displayConfidence(confidence)}%
      </span>
    </div>
  );
}
