"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { ACCEPTED_EXTENSIONS, DEFAULT_MAX_UPLOAD_MB } from "@/lib/config";
import { ScanArc } from "./ScanArc";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
}

/** Corner brackets — a viewfinder, not a dashed box. They tighten on drag. */
function Reticle({ active }: { active: boolean }) {
  const corner =
    "absolute h-6 w-6 border-scan transition-all duration-200 " +
    (active ? "opacity-100" : "opacity-45");
  const inset = active ? "3" : "4";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span
        className={`${corner} border-l-2 border-t-2 rounded-tl-md`}
        style={{ top: `${inset}%`, left: `${inset}%` }}
      />
      <span
        className={`${corner} border-r-2 border-t-2 rounded-tr-md`}
        style={{ top: `${inset}%`, right: `${inset}%` }}
      />
      <span
        className={`${corner} border-b-2 border-l-2 rounded-bl-md`}
        style={{ bottom: `${inset}%`, left: `${inset}%` }}
      />
      <span
        className={`${corner} border-b-2 border-r-2 rounded-br-md`}
        style={{ bottom: `${inset}%`, right: `${inset}%` }}
      />
    </div>
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
      className={`relative flex h-full min-h-[300px] flex-col items-center justify-center gap-5 rounded-lg p-6 text-center transition-colors duration-200 sm:min-h-[360px] ${
        isDragOver ? "bg-housing-3" : "bg-housing-2"
      }`}
    >
      <Reticle active={isDragOver} />

      <div className="w-full max-w-[280px] text-scan">
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

      <p className="relative whitespace-nowrap font-mono text-[0.6875rem] text-glow/70">
        JPG · PNG · WEBP · BMP · max {DEFAULT_MAX_UPLOAD_MB} MB
      </p>

      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
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
