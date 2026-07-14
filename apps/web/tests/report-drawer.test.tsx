/**
 * Report drawer + PDF download.
 *
 * jsdom does not implement <dialog>.showModal(), so the tests polyfill it (the
 * real focus trap is a browser guarantee and is covered in the Playwright
 * suite). What is asserted here is our own behavior: what the report contains,
 * that Escape closes it, that focus returns to the trigger, and that the PDF is
 * generated client-side with the right filename and no re-upload.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ResultPanel } from "@/components/classifier/ResultPanel";
import type { ModelInfoResponse, PredictionResponse } from "@/lib/types";
import { formatProbability, makeReportId, reportFileName } from "@/lib/report";

const savedFiles: string[] = [];
const addedImages: string[] = [];

vi.mock("jspdf", () => {
  class FakeDoc {
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    setDrawColor() {}
    setFillColor() {}
    line() {}
    rect() {}
    text() {}
    addImage(dataUrl: string) {
      addedImages.push(dataUrl);
    }
    splitTextToSize(text: string) {
      return [text];
    }
    save(name: string) {
      savedFiles.push(name);
    }
  }
  return { jsPDF: FakeDoc };
});

const RESULT: PredictionResponse = {
  predicted_class: "Mouth Ulcer",
  confidence: 0.9994,
  probabilities: {
    Calculus: 0.000005,
    Caries: 0.000122,
    Gingivitis: 0.000467,
    Hypodontia: 0.000008,
    "Mouth Ulcer": 0.9994,
    "Tooth Discoloration": 0.000059,
  },
  model_name: "ResNet50V2",
  model_version: "1.0.0",
  mock: false,
};

const MODEL_INFO: ModelInfoResponse = {
  model_name: "ResNet50V2",
  model_version: "1.0.0",
  framework: "tensorflow",
  classes: [
    "Calculus",
    "Caries",
    "Gingivitis",
    "Hypodontia",
    "Mouth Ulcer",
    "Tooth Discoloration",
  ],
  input_size: { width: 224, height: 224 },
  confidence_threshold: 0.5,
  max_upload_mb: 10,
  mock: false,
  disclaimer: "Educational and research use only.",
};

beforeAll(() => {
  // jsdom lacks the dialog API.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

beforeEach(() => {
  savedFiles.length = 0;
  addedImages.length = 0;
});

function renderPanel(overrides: Partial<PredictionResponse> = {}, previewUrl: string | null = null) {
  return render(
    <ResultPanel
      result={{ ...RESULT, ...overrides }}
      modelInfo={MODEL_INFO}
      elapsedMs={412}
      analyzedAt="2026-07-14T10:30:00.000Z"
      previewUrl={previewUrl}
      fileName="sample.jpg"
      onReset={() => {}}
    />,
  );
}

async function openDrawer() {
  await userEvent.click(screen.getByTestId("open-report"));
  await waitFor(() => expect(screen.getByTestId("report-drawer")).toBeVisible());
}

describe("report drawer", () => {
  it("opens from the result panel and closes with Escape, restoring focus", async () => {
    renderPanel();
    const trigger = screen.getByTestId("open-report");

    await openDrawer();

    // Escape fires the dialog's cancel event in a browser; jsdom needs the
    // event dispatched explicitly.
    const dialog = screen.getByTestId("report-drawer");
    dialog.dispatchEvent(new Event("cancel"));

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes with the close button and returns focus to the trigger", async () => {
    renderPanel();
    const trigger = screen.getByTestId("open-report");
    await openDrawer();

    await userEvent.click(screen.getByRole("button", { name: "Close report" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("renders the full analysis: id, timestamp, class, confidence, 6 classes, provenance", async () => {
    renderPanel();
    await openDrawer();

    const drawer = screen.getByTestId("report-drawer");

    expect(drawer).toHaveTextContent(/ARC-\d{14}-[A-Z0-9]{4}/); // report id
    expect(drawer).toHaveTextContent("Analysis report");
    expect(drawer).toHaveTextContent("Mouth Ulcer");
    expect(drawer).toHaveTextContent("99% confidence"); // rounded down, single value
    expect(drawer).not.toHaveTextContent("100%");

    const lists = screen.getAllByTestId("probability-list");
    const drawerList = lists[lists.length - 1];
    expect(drawerList.querySelectorAll("li")).toHaveLength(6);

    // Provenance: model, version, input size, threshold, inference time.
    expect(drawer).toHaveTextContent("ResNet50V2");
    expect(drawer).toHaveTextContent("1.0.0");
    expect(drawer).toHaveTextContent("224×224");
    expect(drawer).toHaveTextContent("50%"); // confidence threshold
    expect(drawer).toHaveTextContent("412 ms");

    // Notices.
    expect(drawer).toHaveTextContent(/not a diagnosis/i);
    expect(drawer).toHaveTextContent(/Educational and research use only/i);
    expect(drawer).toHaveTextContent(/Privacy/i);
    expect(drawer).toHaveTextContent(/not re-uploaded/i);
  });

  it("shows the mock banner in the report only when the result is mock", async () => {
    renderPanel({ mock: true });
    await openDrawer();
    expect(screen.getByTestId("report-drawer")).toHaveTextContent(/Development mock/i);
  });
});

describe("report download", () => {
  it("generates a PDF client-side with a deterministic filename", async () => {
    renderPanel();
    await openDrawer();

    await userEvent.click(screen.getByTestId("download-report"));

    await waitFor(() => expect(savedFiles).toHaveLength(1));
    // The stamp is rendered in the viewer's local timezone, so assert the shape
    // rather than a fixed UTC hour.
    expect(savedFiles[0]).toMatch(/^arcus-analysis-report-2026-07-1[45]-\d{4}\.pdf$/);

    await waitFor(() =>
      expect(screen.getByText("Report downloaded.")).toBeInTheDocument(),
    );
  });

  it("does not re-upload the image to produce the report", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    renderPanel();
    await openDrawer();
    await userEvent.click(screen.getByTestId("download-report"));
    await waitFor(() => expect(savedFiles).toHaveLength(1));

    // No network call whatsoever during report generation.
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("reports a failure safely instead of throwing", async () => {
    renderPanel();
    await openDrawer();

    const { downloadReportPdf } = await import("@/lib/report-pdf");
    vi.spyOn({ downloadReportPdf }, "downloadReportPdf");

    // Force the jsPDF save to throw for this one call.
    const { jsPDF } = (await import("jspdf")) as unknown as { jsPDF: { prototype: { save: () => void } } };
    const original = jsPDF.prototype.save;
    jsPDF.prototype.save = () => {
      throw new Error("boom");
    };

    await userEvent.click(screen.getByTestId("download-report"));
    await waitFor(() =>
      expect(
        screen.getByText(/The report could not be generated/i),
      ).toBeInTheDocument(),
    );

    jsPDF.prototype.save = original;
  });
});

describe("report helpers", () => {
  it("formats tiny probabilities as <0.1% and normal ones with one decimal", () => {
    expect(formatProbability(0.000005)).toBe("<0.1%");
    expect(formatProbability(0.9994)).toBe("99.9%");
    expect(formatProbability(0)).toBe("0.0%"); // an exact zero is honest
  });

  it("builds a deterministic filename and a unique report id", () => {
    expect(reportFileName("2026-01-02T03:04:00.000Z")).toMatch(
      /^arcus-analysis-report-2026-01-0\d-\d{4}\.pdf$/,
    );
    const a = makeReportId("2026-07-14T10:30:00.000Z");
    const b = makeReportId("2026-07-14T10:30:00.000Z");
    expect(a).not.toBe(b);
  });
});
