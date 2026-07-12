"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { predictImage } from "@/lib/api-client";
import { validateImageFile } from "@/lib/validation";
import type { ApiClientError, PredictionResponse } from "@/lib/types";
import { UploadDropzone } from "./UploadDropzone";
import { ImagePreview } from "./ImagePreview";
import { ResultPanel } from "./ResultPanel";
import { StatusPanel } from "./StatusPanel";

type Phase = "empty" | "preview" | "loading" | "result" | "failed";

interface ClassifierState {
  phase: Phase;
  file: File | null;
  previewUrl: string | null;
  result: PredictionResponse | null;
  error: ApiClientError | null;
}

const INITIAL: ClassifierState = {
  phase: "empty",
  file: null,
  previewUrl: null,
  result: null,
  error: null,
};

export function Classifier() {
  const [state, setState] = useState<ClassifierState>(INITIAL);
  const previewUrlRef = useRef<string | null>(null);

  // Track the active object URL and revoke it when replaced or on unmount.
  useEffect(() => {
    previewUrlRef.current = state.previewUrl;
  }, [state.previewUrl]);
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const replacePreview = useCallback((next: Partial<ClassifierState>) => {
    setState((prev) => {
      if (prev.previewUrl && prev.previewUrl !== next.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return { ...INITIAL, ...next };
    });
  }, []);

  const handleFileSelected = useCallback(
    (file: File) => {
      const failure = validateImageFile(file);
      if (failure) {
        replacePreview({
          phase: "failed",
          error: { kind: "invalid_file", code: failure.code, message: failure.message },
        });
        return;
      }
      replacePreview({
        phase: "preview",
        file,
        previewUrl: URL.createObjectURL(file),
      });
    },
    [replacePreview],
  );

  const handleRemove = useCallback(() => replacePreview({}), [replacePreview]);

  const handleAnalyze = useCallback(async () => {
    if (state.phase !== "preview" || !state.file) return; // duplicate-submit guard
    setState((prev) => ({ ...prev, phase: "loading", error: null }));

    const result = await predictImage(state.file);
    setState((prev) => {
      // Ignore stale responses if the image was removed meanwhile.
      if (prev.phase !== "loading") return prev;
      if (result.ok) {
        return { ...prev, phase: "result", result: result.data };
      }
      if (result.error.kind === "invalid_file") {
        // The image itself was rejected — drop the preview.
        if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return { ...INITIAL, phase: "failed", error: result.error };
      }
      // Service problems keep the preview so the user can retry.
      return { ...prev, phase: "preview", error: result.error };
    });
  }, [state.phase, state.file]);

  const handleReset = useCallback(() => replacePreview({}), [replacePreview]);

  const showViewingSurface = state.previewUrl !== null;

  return (
    <section id="classifier" aria-labelledby="classifier-heading" className="scroll-mt-24">
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <h2 id="classifier-heading" className="sr-only">
          Image classifier
        </h2>
        <div className="on-housing rounded-lg bg-housing p-4 shadow-2 sm:p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 px-1">
            <p className="font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-glow/70">
              Viewing surface
            </p>
            <p className="font-mono text-xs text-glow/70">
              JPG · PNG · WEBP · BMP
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            {/* Viewing surface */}
            <div
              className={`power-on relative min-h-[320px] overflow-hidden rounded-md sm:min-h-[400px] ${
                showViewingSurface ? "viewing-lit bg-glow" : "bg-housing-2"
              }`}
            >
              {showViewingSurface && state.previewUrl && state.file ? (
                <ImagePreview
                  previewUrl={state.previewUrl}
                  file={state.file}
                  isAnalyzing={state.phase === "loading"}
                  onRemove={handleRemove}
                  removeDisabled={state.phase === "loading"}
                />
              ) : (
                <UploadDropzone onFileSelected={handleFileSelected} />
              )}
            </div>

            {/* Chart / result panel */}
            <div
              className="flex min-h-[320px] flex-col rounded-md bg-housing-2 p-5 sm:min-h-[400px]"
              aria-live="polite"
            >
              {state.phase === "result" && state.result ? (
                <ResultPanel result={state.result} onReset={handleReset} />
              ) : (
                <StatusPanel
                  phase={state.phase}
                  error={state.error}
                  canAnalyze={state.phase === "preview"}
                  onAnalyze={handleAnalyze}
                  onReset={handleReset}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
