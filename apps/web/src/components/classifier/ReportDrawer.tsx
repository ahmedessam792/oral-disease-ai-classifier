"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, RotateCcw, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { DISCLAIMER } from "@/lib/config";
import { displayConfidence, formatTimestamp, type AnalysisReport } from "@/lib/report";
import { ProbabilityList } from "./ProbabilityList";

interface ReportDrawerProps {
  open: boolean;
  report: AnalysisReport;
  previewUrl: string | null;
  onClose: () => void;
  onReset: () => void;
}

type DownloadState = "idle" | "working" | "done" | "failed";

/**
 * The full analysis report: a right-side drawer on desktop, a full-screen sheet
 * on mobile.
 *
 * Built on <dialog showModal()>, which gives focus trapping, Escape-to-close,
 * and inertness of the page behind it natively — far more robust than a
 * hand-rolled trap. Focus returns to the trigger button (handled by the parent
 * via onClose).
 *
 * It opens with its own 220ms panel animation; the route transition is never
 * involved, because no route changes.
 */
export function ReportDrawer({
  open,
  report,
  previewUrl,
  onClose,
  onReset,
}: ReportDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [download, setDownload] = useState<DownloadState>("idle");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setDownload("idle");
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const { result, modelInfo, elapsedMs, analyzedAt, reportId } = report;

  const handleDownload = async () => {
    setDownload("working");
    try {
      const { downloadReportPdf } = await import("@/lib/report-pdf");
      await downloadReportPdf(report, previewUrl);
      setDownload("done");
    } catch {
      setDownload("failed");
    }
  };

  const specs: [string, string][] = [
    ["Model", result.model_name],
    ["Version", result.model_version],
    ...(modelInfo
      ? ([
          ["Input size", `${modelInfo.input_size.width}×${modelInfo.input_size.height}`],
          ["Classes", String(modelInfo.classes.length)],
          [
            "Confidence threshold",
            `${(modelInfo.confidence_threshold * 100).toFixed(0)}%`,
          ],
        ] as [string, string][])
      : []),
    ...(elapsedMs !== null
      ? ([["Inference round-trip", `${elapsedMs} ms`]] as [string, string][])
      : []),
  ];

  return (
    <dialog
      ref={dialogRef}
      data-testid="report-drawer"
      aria-labelledby="report-title"
      onClose={onClose}
      onCancel={onClose} // Escape
      className="print-report fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-ink/50 backdrop:backdrop-blur-[2px]"
    >
      {/* Mount the contents only while open: a closed dialog must not leave a
          duplicate copy of the report (and its probability list) in the DOM.
          The panel is w-full, never w-screen — 100vw includes the scrollbar and
          would push the document into horizontal overflow. */}
      {!open ? null : (
      <div className="drawer-panel ml-auto flex h-full w-full max-w-full flex-col overflow-y-auto bg-porcelain shadow-drawer md:w-[560px]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-porcelain/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div>
            <Wordmark />
            <h2 id="report-title" className="mt-2 font-display text-h3 font-semibold text-ink">
              Analysis report
            </h2>
            <p className="mt-1 font-mono text-caption text-ink-faint">
              {reportId} · {formatTimestamp(analyzedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report"
            className="no-print flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-line/60 hover:text-ink"
          >
            <X aria-hidden="true" size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-6 px-5 py-6 sm:px-6">
          <p className="rounded-md border border-teal/30 bg-teal-wash px-3 py-2 text-caption text-teal-deep">
            <strong className="font-medium">This result is not a diagnosis.</strong>
          </p>

          {result.mock && (
            <p className="rounded-md border border-warn-ink/40 bg-warn-ink/10 px-3 py-2 font-mono text-xs text-warn-ink">
              Development mock — not a real classification result
            </p>
          )}

          {/* Specimen */}
          {previewUrl && (
            <figure className="print-keep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="The analyzed image"
                className="max-h-64 w-full rounded-lg border border-line bg-surface object-contain p-2"
              />
              <figcaption className="mt-2 font-mono text-caption text-ink-faint">
                Analyzed image · processed in memory, not stored
              </figcaption>
            </figure>
          )}

          {/* Headline result */}
          <div className="print-keep">
            <p className="eyebrow">AI classification result</p>
            <p className="mt-2 font-display text-h2 font-semibold text-ink [overflow-wrap:anywhere]">
              {result.predicted_class}
            </p>
            <p className="mt-1 font-mono text-sm tabular-nums text-ink-soft">
              {displayConfidence(result.confidence)}% confidence
              <span className="text-ink-faint"> · rounded down</span>
            </p>
            <p className="mt-2 max-w-[60ch] text-xs leading-relaxed text-ink-soft">
              Confidence reflects how similar this image looked to the model&apos;s
              training examples — not whether the classification is correct.
            </p>
          </div>

          {/* Distribution */}
          <div>
            <p className="eyebrow mb-3">Probability distribution</p>
            <ProbabilityList
              probabilities={result.probabilities}
              predictedClass={result.predicted_class}
              tone="light"
            />
          </div>

          {/* Provenance */}
          <div>
            <p className="eyebrow mb-3">Model</p>
            <dl className="grid grid-cols-2 gap-3">
              {specs.map(([label, value]) => (
                <div key={label} className="rounded-md border border-line bg-surface px-3 py-2">
                  <dt className="font-mono text-caption uppercase tracking-[0.1em] text-ink-faint">
                    {label}
                  </dt>
                  <dd className="mt-1 truncate font-mono text-xs text-ink" title={value}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Notices */}
          <div className="flex flex-col gap-2 border-t border-line pt-4 text-xs leading-relaxed text-ink-soft">
            <p>
              <strong className="font-medium text-ink">Medical disclaimer.</strong>{" "}
              {DISCLAIMER}
            </p>
            <p>
              <strong className="font-medium text-ink">Privacy.</strong> The image was
              processed in memory and was not stored by the service. This report was
              generated entirely in your browser — the image was not re-uploaded to
              create it.
            </p>
          </div>

          {/* Actions */}
          <div className="no-print flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleDownload}
              disabled={download === "working"}
              data-testid="download-report"
              className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-teal px-4 text-sm font-medium text-white transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {download === "working" ? (
                <Loader2 aria-hidden="true" size={15} className="animate-spin" />
              ) : (
                <Download aria-hidden="true" size={15} strokeWidth={1.75} />
              )}
              {download === "working" ? "Preparing PDF…" : "Download report (PDF)"}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onReset();
              }}
              className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-line-strong"
            >
              <RotateCcw aria-hidden="true" size={15} strokeWidth={1.75} />
              Analyze another image
            </button>
          </div>

          <p aria-live="polite" className="no-print min-h-5 text-xs text-ink-soft">
            {download === "done" && "Report downloaded."}
            {download === "failed" && "The report could not be generated. Please try again."}
          </p>
        </div>
      </div>
      )}
    </dialog>
  );
}
