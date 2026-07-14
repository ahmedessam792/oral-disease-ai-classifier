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
import type { ModelInfoResponse, PredictionResponse } from "@/lib/types";

vi.mock("@/lib/api-client", () => ({
  predictImage: vi.fn(),
  getModelInfo: vi.fn(),
}));
import { getModelInfo, predictImage } from "@/lib/api-client";
const predictImageMock = vi.mocked(predictImage);
const getModelInfoMock = vi.mocked(getModelInfo);

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

export const MODEL_INFO: ModelInfoResponse = {
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
  disclaimer:
    "Arcus provides an AI classification result and is not a substitute for professional medical advice, diagnosis, or treatment.",
};

function renderResult(overrides: Partial<PredictionResponse> = {}) {
  return render(
    <ResultPanel
      result={{ ...REAL_PREDICTION, ...overrides }}
      modelInfo={MODEL_INFO}
      elapsedMs={412}
      analyzedAt="2026-07-14T10:30:00.000Z"
      previewUrl={null}
      fileName="sample.jpg"
      onReset={() => {}}
    />,
  );
}

beforeEach(() => {
  predictImageMock.mockReset();
  getModelInfoMock.mockReset();
  getModelInfoMock.mockResolvedValue({ ok: true, data: MODEL_INFO });
});

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

  it("renders model provenance: name, version, input size, inference time", async () => {
    predictImageMock.mockResolvedValue({ ok: true, data: REAL_PREDICTION });
    render(<Classifier />);
    await analyze();

    const provenance = await screen.findByTestId("provenance");
    expect(provenance).toHaveTextContent("ResNet50V2");
    expect(provenance).toHaveTextContent("v1.0.0");
    expect(provenance).toHaveTextContent("224×224");
    expect(provenance).toHaveTextContent(/\d+ ms/);
  });

  it("shows exactly ONE confidence value in the headline block, rounded down", () => {
    renderResult();

    // 81.23% -> "81%" in the ring. The old UI printed a SECOND, disagreeing
    // figure right beside it ("confidence 81.2%"); that must not come back.
    // (81.2% still appears once as this class's row in the distribution — that
    // is the distribution, not a second confidence readout.)
    expect(screen.getByText("81%")).toBeInTheDocument();
    expect(screen.queryByText(/^confidence \d+\.\d%$/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("81.2%")).toHaveLength(1);
    expect(screen.getByText(/not certainty/i)).toBeInTheDocument();
  });

  it("never displays 100% for a 99.9% result", () => {
    renderResult({ confidence: 0.999, probabilities: { ...REAL_PREDICTION.probabilities } });
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
    expect(screen.getByText("99%")).toBeInTheDocument();
  });

  it("renders all six real class labels", () => {
    renderResult();
    const items = screen.getByTestId("probability-list").querySelectorAll("li");
    expect(items).toHaveLength(6);
    for (const label of MODEL_INFO.classes) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(items[0]).toHaveTextContent("Tooth Discoloration");
  });

  it("renders vanishingly small probabilities as <0.1%, never a bare 0.0%", () => {
    renderResult({
      probabilities: {
        Calculus: 0.00002,
        Caries: 0.00001,
        Gingivitis: 0.0688,
        Hypodontia: 0.0201,
        "Mouth Ulcer": 0.0255,
        "Tooth Discoloration": 0.8855,
      },
    });

    expect(screen.getAllByText("<0.1%").length).toBe(2);
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
  });

  it("keeps long class names intact and titled for overflow", () => {
    renderResult();

    const titled = screen.getAllByTitle("Tooth Discoloration");
    expect(titled.length).toBeGreaterThanOrEqual(2);
    for (const element of titled) {
      expect(element).toHaveTextContent("Tooth Discoloration");
    }

    const rows = screen.getByTestId("probability-list").querySelectorAll("li");
    const mouthUlcer = Array.from(rows).find((row) =>
      row.textContent?.includes("Mouth Ulcer"),
    );
    expect(mouthUlcer?.querySelector("[title='Mouth Ulcer']")).not.toBeNull();
  });

  it("still shows the medical disclaimer with a real result", () => {
    renderResult();
    expect(
      screen.getByText(/not a substitute for professional medical advice/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/not certainty/i)).toBeInTheDocument();
  });
});
