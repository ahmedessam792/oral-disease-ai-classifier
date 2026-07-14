"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { predictImage } from "@/lib/api-client";
import { validateImageFile } from "@/lib/validation";
import { useModelInfo } from "@/lib/use-model-info";
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
  /** Round-trip time of the prediction request, measured client-side. */
  elapsedMs: number | null;
  analyzedAt: string | null;
}

const INITIAL: ClassifierState = {
  phase: "empty",
  file: null,
  previewUrl: null,
  result: null,
  error: null,
  elapsedMs: null,
  analyzedAt: null,
};

export function Classifier() {
  const [state, setState] = useState<ClassifierState>(INITIAL);
  const previewUrlRef = useRef<string | null>(null);
  const modelInfo = useModelInfo();

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

    const startedAt = performance.now();
    const result = await predictImage(state.file);
    const elapsedMs = Math.round(performance.now() - startedAt);

    setState((prev) => {
      if (prev.phase !== "loading") return prev; // stale response — image was removed
      if (result.ok) {
        return {
          ...prev,
          phase: "result",
          result: result.data,
          elapsedMs,
          analyzedAt: new Date().toISOString(),
        };
      }
      if (result.error.kind === "invalid_file") {
        if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return { ...INITIAL, phase: "failed", error: result.error };
      }
      return { ...prev, phase: "preview", error: result.error };
    });
  }, [state.phase, state.file]);

  const handleReset = useCallback(() => replacePreview({}), [replacePreview]);

  const hasImage = state.previewUrl !== null && state.file !== null;
  const info = modelInfo.status === "loaded" ? modelInfo.info : null;

  // min-w-0 on the section: it is a grid child, and the truncating model line in
  // the header has a wide min-content. Without it the column refuses to shrink
  // below that width and the whole page overflows horizontally on mobile.
  return (
    <section
      id="classifier"
      aria-labelledby="classifier-heading"
      className="on-housing instrument min-w-0 scroll-mt-20 rounded-xl p-3 sm:p-4"
    >
      <h2 id="classifier-heading" className="sr-only">
        Image classifier
      </h2>

      <div className="flex min-w-0 items-center justify-between gap-3 px-2 pb-3 pt-1">
        <p className="shrink-0 font-mono text-caption font-medium uppercase tracking-[0.14em] text-scan">
          Analyzer
        </p>
        {info && (
          <p className="min-w-0 truncate font-mono text-caption text-glow/70">
            {info.model_name} · {info.input_size.width}×{info.input_size.height}
          </p>
        )}
      </div>

      {/* grid-cols-1 (= minmax(0,1fr)) is load-bearing: a bare `grid` makes one
          `auto` track, which sizes to max-content and overflows the viewport on
          mobile once the report panel's nowrap content is in it. */}
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
        {/* Viewing surface. self-start + a height cap: previously this stretched
            to the report panel's height and marooned the image in white. */}
        <div
          className={`power-on relative min-h-[280px] self-start overflow-hidden rounded-lg sm:min-h-[320px] lg:max-h-[520px] ${
            hasImage ? "viewing-lit bg-glow" : "bg-housing-2"
          }`}
        >
          {hasImage && state.previewUrl && state.file ? (
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

        <div
          className="flex min-h-[280px] flex-col rounded-lg bg-housing-2 p-5 sm:min-h-[320px]"
          aria-live="polite"
        >
          {state.phase === "result" && state.result ? (
            <ResultPanel
              result={state.result}
              modelInfo={info}
              elapsedMs={state.elapsedMs}
              analyzedAt={state.analyzedAt}
              previewUrl={state.previewUrl}
              fileName={state.file?.name ?? null}
              onReset={handleReset}
            />
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
    </section>
  );
}
