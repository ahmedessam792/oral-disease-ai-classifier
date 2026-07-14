"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { ACCEPTED_EXTENSIONS, DEFAULT_MAX_UPLOAD_MB } from "@/lib/config";
import { ScanArc } from "./ScanArc";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
}

/**
 * Viewfinder corner brackets, drawn as one SVG.
 *
 * These were four bordered <span>s; the anti-pattern detector kept reading the
 * 2px directional borders as the "side-tab" card tell. Same visual, one
 * element, no false positives — and the brackets tighten on drag.
 */
function Reticle({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-scan"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <g
        stroke="currentColor"
        strokeWidth={active ? 0.7 : 0.55}
        strokeLinecap="round"
        opacity={active ? 1 : 0.45}
        style={{ transition: "opacity 200ms ease-out, stroke-width 200ms ease-out" }}
      >
        {/* top-left, top-right, bottom-left, bottom-right */}
        <path d={active ? "M3 11 V3 H11" : "M4 13 V4 H13"} />
        <path d={active ? "M89 3 H97 V11" : "M87 4 H96 V13"} />
        <path d={active ? "M3 89 V97 H11" : "M4 87 V96 H13"} />
        <path d={active ? "M97 89 V97 H89" : "M96 87 V96 H87"} />
      </g>
    </svg>
  );
}

export function UploadDropzone({ onFileSelected }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected],
  );

  return (
    <div
      data-testid="dropzone"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex h-full min-h-[280px] flex-col items-center justify-center gap-4 rounded-lg p-6 text-center transition-colors duration-200 sm:min-h-[320px] ${
        isDragOver ? "bg-housing-3" : "bg-housing-2"
      }`}
    >
      <Reticle active={isDragOver} />

      <div className="w-full max-w-[248px] text-scan">
        <ScanArc />
      </div>

      <div className="relative">
        <p className="font-medium text-glow">Drop an oral image here</p>
        <p className="mt-1 text-sm text-glow/70">or browse from your device</p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex h-11 cursor-pointer items-center rounded-md bg-glow px-5 font-medium text-ink transition-colors duration-200 hover:bg-white"
      >
        Browse files
      </button>

      {/* Format + size live only here — the instrument header no longer repeats them. */}
      <p className="relative whitespace-nowrap font-mono text-caption text-glow/70">
        {ACCEPTED_EXTENSIONS.map((ext) => ext.replace(".", "").toUpperCase()).join(" · ")} ·
        max {DEFAULT_MAX_UPLOAD_MB} MB
      </p>

      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        // Removed from the tab order: the visible "Browse files" button is the
        // control. Otherwise Tab lands on an invisible 1x1 input.
        tabIndex={-1}
        className="sr-only"
        aria-label="Choose an oral image to analyze"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
          event.target.value = ""; // allow re-selecting the same file
        }}
      />
    </div>
  );
}
