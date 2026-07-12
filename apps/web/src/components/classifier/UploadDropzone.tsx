"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { ImageUp } from "lucide-react";
import { ACCEPTED_EXTENSIONS, DEFAULT_MAX_UPLOAD_MB } from "@/lib/config";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
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
      className={`flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-md border border-dashed p-8 text-center transition-colors sm:min-h-[400px] ${
        isDragOver ? "border-glow/80 bg-housing" : "border-glow/25"
      }`}
    >
      <ImageUp aria-hidden="true" size={28} strokeWidth={1.5} className="text-glow/60" />
      <div>
        <p className="text-glow">Drop an oral image here</p>
        <p className="mt-1 text-sm text-glow/70">
          Photographs of teeth, gums, or oral tissue
        </p>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-md bg-glow px-5 py-2.5 font-medium text-ink transition-colors hover:bg-white"
      >
        Browse files
      </button>
      <p className="font-mono text-xs text-glow/70">
        {ACCEPTED_EXTENSIONS.join(" ")} · up to {DEFAULT_MAX_UPLOAD_MB} MB
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
