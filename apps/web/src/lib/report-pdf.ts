import { DISCLAIMER } from "./config";
import {
  formatProbability,
  formatTimestamp,
  reportFileName,
  sortedProbabilities,
  type AnalysisReport,
} from "./report";

/**
 * Client-side PDF. jsPDF is imported lazily so it costs nothing until the user
 * actually asks for a report.
 *
 * Privacy: the specimen image is re-drawn from the existing in-memory object
 * URL onto a canvas and re-encoded as JPEG. That means (a) the image is never
 * re-uploaded to the API for the report, (b) it is never persisted anywhere,
 * and (c) EXIF metadata is stripped by construction — a canvas re-encode
 * carries no original metadata.
 *
 * Content is drawn exclusively from the real API response. No accuracy, no
 * recommendation, no treatment advice, no diagnosis language.
 */

const MARGIN = 18;
const PAGE_WIDTH = 210; // A4 mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

async function imageFromObjectUrl(
  previewUrl: string,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("preview could not be read"));
      element.src = previewUrl;
    });

    // Cap the long edge: keeps the PDF small and the re-encode fast.
    const maxEdge = 1000;
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(image, 0, 0, width, height);

    // The re-encode is what strips EXIF.
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.82), width, height };
  } catch {
    return null; // a report without the image is still a valid report
  }
}

export async function downloadReportPdf(
  report: AnalysisReport,
  previewUrl: string | null,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const { result, modelInfo, elapsedMs, analyzedAt, reportId } = report;
  let y = MARGIN;

  // --- Header: Arcus ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(16, 30, 36); // ink
  doc.text("Arcus", MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(75, 93, 102); // ink-soft
  doc.text("Oral Diseases Image Classification", MARGIN, (y += 6));

  doc.setFontSize(9);
  doc.setTextColor(20, 111, 99); // teal
  doc.text("Not a diagnosis. Not a substitute for professional medical advice.", MARGIN, (y += 5));

  doc.setDrawColor(220, 227, 225);
  doc.line(MARGIN, (y += 4), PAGE_WIDTH - MARGIN, y);

  // --- Meta ---
  doc.setTextColor(75, 93, 102);
  doc.setFontSize(9);
  y += 6;
  doc.text(`Report ID: ${reportId}`, MARGIN, y);
  doc.text(`Analyzed: ${formatTimestamp(analyzedAt)}`, PAGE_WIDTH - MARGIN, y, {
    align: "right",
  });

  // --- Specimen image (optional) ---
  y += 6;
  if (previewUrl) {
    const image = await imageFromObjectUrl(previewUrl);
    if (image) {
      const boxWidth = 70;
      const boxHeight = (image.height / image.width) * boxWidth;
      const capped = Math.min(boxHeight, 60);
      const drawWidth = capped === boxHeight ? boxWidth : (image.width / image.height) * capped;
      doc.addImage(image.dataUrl, "JPEG", MARGIN, y, drawWidth, capped);
      y += capped + 6;
    }
  }

  // --- Result ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(16, 30, 36);
  doc.text("AI classification result", MARGIN, y);

  doc.setFontSize(18);
  doc.text(result.predicted_class, MARGIN, (y += 8));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(75, 93, 102);
  doc.text(
    `Confidence ${(result.confidence * 100).toFixed(1)}%  ·  confidence is not certainty`,
    MARGIN,
    (y += 6),
  );

  // --- Probability distribution (all classes) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(16, 30, 36);
  doc.text("Probability distribution", MARGIN, (y += 10));
  y += 3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  for (const [label, probability] of sortedProbabilities(result.probabilities)) {
    y += 7;
    const isPredicted = label === result.predicted_class;
    doc.setTextColor(isPredicted ? 16 : 75, isPredicted ? 30 : 93, isPredicted ? 36 : 102);
    doc.text(label, MARGIN, y);
    doc.text(formatProbability(probability), PAGE_WIDTH - MARGIN, y, { align: "right" });

    // Track + fill. Every class keeps a visible sliver.
    const trackY = y + 1.6;
    doc.setFillColor(232, 236, 235);
    doc.rect(MARGIN, trackY, CONTENT_WIDTH, 1.4, "F");
    const fill = Math.max(probability * CONTENT_WIDTH, 0.8);
    if (isPredicted) doc.setFillColor(191, 98, 114);
    else doc.setFillColor(20, 111, 99);
    doc.rect(MARGIN, trackY, fill, 1.4, "F");
    y += 2;
  }

  // --- Model provenance ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(16, 30, 36);
  doc.text("Model", MARGIN, (y += 12));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 93, 102);

  const provenance: string[] = [
    `Name: ${result.model_name}`,
    `Version: ${result.model_version}`,
  ];
  if (modelInfo) {
    provenance.push(
      `Input size: ${modelInfo.input_size.width}×${modelInfo.input_size.height}`,
      `Classes: ${modelInfo.classes.length}`,
      `Confidence threshold: ${(modelInfo.confidence_threshold * 100).toFixed(0)}%`,
    );
  }
  if (elapsedMs !== null) provenance.push(`Inference round-trip: ${elapsedMs} ms`);
  if (result.mock) provenance.push("MODE: DEVELOPMENT MOCK — NOT A REAL CLASSIFICATION RESULT");

  for (const line of provenance) {
    doc.text(line, MARGIN, (y += 5));
  }

  // --- Notices ---
  doc.setDrawColor(220, 227, 225);
  doc.line(MARGIN, (y += 8), PAGE_WIDTH - MARGIN, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(16, 30, 36);
  doc.text("This result is not a diagnosis.", MARGIN, (y += 7));

  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 93, 102);
  const notices = [
    DISCLAIMER,
    "Confidence reflects how similar this image looked to the model's training examples — not whether the classification is correct. The model can only choose among the classes it was trained on.",
    "Privacy: the image was processed in memory and was not stored by the service. This report was generated entirely in your browser; the image was not re-uploaded to produce it.",
  ];
  for (const notice of notices) {
    const lines = doc.splitTextToSize(notice, CONTENT_WIDTH) as string[];
    doc.text(lines, MARGIN, (y += 5));
    y += (lines.length - 1) * 4;
  }

  doc.save(reportFileName(analyzedAt));
}
