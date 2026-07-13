/**
 * Real-model rendering: when the API reports `mock: false`, the UI must show
 * no mock banner, and real class labels (including long ones like
 * "Tooth Discoloration") must render intact.
 *
 * Labels here are the real model's classes, but they arrive from the API
 * fixture — the frontend never hardcodes them.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Classifier } from "@/components/classifier/Classifier";
import { ResultPanel } from "@/components/classifier/ResultPanel";
import type { PredictionResponse } from "@/lib/types";

vi.mock("@/lib/api-client", () => ({ predictImage: vi.fn() }));
import { predictImage } from "@/lib/api-client";
const predictImageMock = vi.mocked(predictImage);

const REAL_PREDICTION: PredictionResponse = {
  predicted_class: "Tooth Discoloration",
  confidence: 0.8123,
  probabilities: {
    Calculus: 0.0421,
    Caries: 0.0312,
    Gingivitis: 0.0688,
    Hypodontia: 0.0201,
    "Mouth Ulcer": 0.0255,
    "Tooth Discoloration": 0.8123,
  },
  model_name: "ResNet50V2",
  model_version: "1.0.0",
  mock: false,
};

beforeEach(() => predictImageMock.mockReset());

async function analyze() {
  const input = screen.getByTestId("file-input") as HTMLInputElement;
  await userEvent.upload(input, new File(["x"], "sample.jpg", { type: "image/jpeg" }));
  await userEvent.click(screen.getByRole("button", { name: "Analyze image" }));
  await waitFor(() => expect(screen.getByTestId("result-panel")).toBeInTheDocument());
}

describe("real-model mode", () => {
  it("shows NO mock banner when mock is false", async () => {
    predictImageMock.mockResolvedValue({ ok: true, data: REAL_PREDICTION });
    render(<Classifier />);
    await analyze();

    expect(screen.queryByTestId("mock-banner")).not.toBeInTheDocument();
    expect(screen.queryByText(/Development mock/i)).not.toBeInTheDocument();
  });

  it("renders the real model name, version, and confidence", async () => {
    predictImageMock.mockResolvedValue({ ok: true, data: REAL_PREDICTION });
    render(<Classifier />);
    await analyze();

    expect(screen.getByText("ResNet50V2 · v1.0.0")).toBeInTheDocument();
    expect(screen.getByText("confidence 81.2%")).toBeInTheDocument();
  });

  it("renders all six real class labels, longest first when predicted", async () => {
    predictImageMock.mockResolvedValue({ ok: true, data: REAL_PREDICTION });
    render(<Classifier />);
    await analyze();

    const items = screen.getByTestId("probability-list").querySelectorAll("li");
    expect(items).toHaveLength(6);

    for (const label of Object.keys(REAL_PREDICTION.probabilities)) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    // Highest probability sorts to the top.
    expect(items[0]).toHaveTextContent("Tooth Discoloration");
    expect(items[0]).toHaveTextContent("81.2%");
  });

  it("keeps long class names intact and titled for overflow", () => {
    render(<ResultPanel result={REAL_PREDICTION} onReset={() => {}} />);

    // The long label is titled in both places it appears (the predicted-class
    // heading and its probability row), so a truncated label stays readable.
    const titled = screen.getAllByTitle("Tooth Discoloration");
    expect(titled.length).toBeGreaterThanOrEqual(2);
    for (const element of titled) {
      expect(element).toHaveTextContent("Tooth Discoloration");
    }

    const rows = screen.getByTestId("probability-list").querySelectorAll("li");
    const mouthUlcer = Array.from(rows).find((row) =>
      row.textContent?.includes("Mouth Ulcer"),
    );
    expect(mouthUlcer).toBeDefined();
    expect(mouthUlcer?.querySelector("[title='Mouth Ulcer']")).not.toBeNull();
  });

  it("still shows the medical disclaimer with a real result", () => {
    render(<ResultPanel result={REAL_PREDICTION} onReset={() => {}} />);
    expect(screen.getByText(/not a substitute for professional medical advice/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidence is not certainty/i)).toBeInTheDocument();
  });
});
