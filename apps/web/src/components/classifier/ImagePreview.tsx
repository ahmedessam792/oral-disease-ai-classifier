"use client";

import { X } from "lucide-react";
import { formatFileSize } from "@/lib/validation";

interface ImagePreviewProps {
  previewUrl: string;
  file: File;
  isAnalyzing: boolean;
  onRemove: () => void;
  removeDisabled: boolean;
}

export function ImagePreview({
  previewUrl,
  file,
  isAnalyzing,
  onRemove,
  removeDisabled,
}: ImagePreviewProps) {
  return (
    <figure className="relative flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden">
        {/* Object URL preview — next/image adds nothing for blob: URLs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={`Preview of ${file.name}`}
          className={`absolute inset-0 h-full w-full object-contain p-3 transition-opacity ${
            isAnalyzing ? "opacity-40" : "opacity-100"
          }`}
        />
        {isAnalyzing && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="analysis-sweep h-[9%] w-full bg-gradient-to-b from-transparent via-white/70 to-transparent" />
          </div>
        )}
        {!isAnalyzing && (
          <button
            type="button"
            onClick={onRemove}
            disabled={removeDisabled}
            aria-label="Remove image"
            className="absolute right-3 top-3 rounded-md bg-ink/70 p-2 text-glow transition-colors hover:bg-ink"
          >
            <X aria-hidden="true" size={16} strokeWidth={2} />
          </button>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-3 border-t border-ink/10 px-4 py-2.5 font-mono text-xs text-ink-soft">
        <span className="truncate">{file.name}</span>
        <span className="shrink-0">{formatFileSize(file.size)}</span>
      </figcaption>
    </figure>
  );
}
