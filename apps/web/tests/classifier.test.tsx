import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Classifier } from "@/components/classifier/Classifier";
import type { ApiResult, PredictionResponse } from "@/lib/types";

vi.mock("@/lib/api-client", () => ({
  predictImage: vi.fn(),
}));

import { predictImage } from "@/lib/api-client";
const predictImageMock = vi.mocked(predictImage);

const PREDICTION: PredictionResponse = {
  predicted_class: "Mock Class B",
  confidence: 0.72,
  probabilities: { "Mock Class A": 0.18, "Mock Class B": 0.72, "Mock Class C": 0.1 },
  model_name: "mock-development-model",
  model_version: "0.0.0-mock",
  mock: true,
};

function validFile(name = "photo.jpg"): File {
  return new File(["image-bytes"], name, { type: "image/jpeg" });
}

async function selectFile(file: File) {
  const input = screen.getByTestId("file-input") as HTMLInputElement;
  await userEvent.upload(input, file);
}

beforeEach(() => {
  predictImageMock.mockReset();
});

describe("Classifier", () => {
  it("starts in the empty state with a dropzone", () => {
    render(<Classifier />);
    expect(screen.getByText("Drop an oral image here")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse files" })).toBeInTheDocument();
  });

  it("shows a preview with filename and analyze button after selecting a file", async () => {
    render(<Classifier />);
    await selectFile(validFile("molar.jpg"));

    expect(screen.getByAltText("Preview of molar.jpg")).toBeInTheDocument();
    expect(screen.getByText("molar.jpg")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analyze image" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Remove image" })).toBeInTheDocument();
  });

  it("rejects an invalid file with an alert and recovery action", async () => {
    render(<Classifier />);
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    await userEvent.upload(
      input,
      new File(["not-an-image"], "notes.txt", { type: "text/plain" }),
      { applyAccept: false },
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Unsupported file type");
    expect(screen.getByRole("button", { name: "Choose another image" })).toBeInTheDocument();
    expect(predictImageMock).not.toHaveBeenCalled();
  });

  it("removing the image returns to the dropzone", async () => {
    render(<Classifier />);
    await selectFile(validFile());
    await userEvent.click(screen.getByRole("button", { name: "Remove image" }));
    expect(screen.getByText("Drop an oral image here")).toBeInTheDocument();
  });

  it("runs a successful analysis and renders the full result", async () => {
    predictImageMock.mockResolvedValue({ ok: true, data: PREDICTION });
    render(<Classifier />);
    await selectFile(validFile());
    await userEvent.click(screen.getByRole("button", { name: "Analyze image" }));

    await waitFor(() => expect(screen.getByTestId("result-panel")).toBeInTheDocument());
    expect(screen.getAllByText("Mock Class B").length).toBeGreaterThan(0);
    expect(screen.getByText("confidence 72.0%")).toBeInTheDocument();
    expect(screen.getByTestId("probability-list")).toBeInTheDocument();
    expect(screen.getByTestId("mock-banner")).toBeInTheDocument();
    expect(screen.getByText(/mock-development-model/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Analyze another image" }),
    ).toBeInTheDocument();
  });

  it("blocks duplicate submissions while analyzing", async () => {
    let resolvePrediction!: (value: ApiResult<PredictionResponse>) => void;
    predictImageMock.mockReturnValue(
      new Promise<ApiResult<PredictionResponse>>((resolve) => {
        resolvePrediction = resolve;
      }),
    );
    render(<Classifier />);
    await selectFile(validFile());

    const analyze = screen.getByRole("button", { name: "Analyze image" });
    await userEvent.click(analyze);

    const analyzing = screen.getByRole("button", { name: "Analyzing…" });
    expect(analyzing).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Analyzing image…");
    expect(predictImageMock).toHaveBeenCalledTimes(1);

    resolvePrediction({ ok: true, data: PREDICTION });
    await waitFor(() => expect(screen.getByTestId("result-panel")).toBeInTheDocument());
  });

  it("shows the missing-model state and keeps the preview for retry", async () => {
    predictImageMock.mockResolvedValue({
      ok: false,
      error: {
        kind: "model_unavailable",
        code: "MODEL_NOT_AVAILABLE",
        message: "The classification model is not available. Please try again later.",
      },
    });
    render(<Classifier />);
    await selectFile(validFile());
    await userEvent.click(screen.getByRole("button", { name: "Analyze image" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "The classification model isn't available yet",
      ),
    );
    // Preview retained so the user can retry the same image.
    expect(screen.getByRole("button", { name: "Analyze image" })).toBeEnabled();
  });

  it("shows the backend-unavailable state on network failure", async () => {
    predictImageMock.mockResolvedValue({
      ok: false,
      error: { kind: "network", code: "NETWORK", message: "Check your connection." },
    });
    render(<Classifier />);
    await selectFile(validFile());
    await userEvent.click(screen.getByRole("button", { name: "Analyze image" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Can't reach the analysis service"),
    );
  });

  it("drops the preview when the backend rejects the image itself", async () => {
    predictImageMock.mockResolvedValue({
      ok: false,
      error: { kind: "invalid_file", code: "INVALID_IMAGE", message: "Not a valid image." },
    });
    render(<Classifier />);
    await selectFile(validFile());
    await userEvent.click(screen.getByRole("button", { name: "Analyze image" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Not a valid image."));
    expect(screen.getByRole("button", { name: "Choose another image" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Analyze image" })).not.toBeInTheDocument();
  });

  it("analyze another image resets to the empty state", async () => {
    predictImageMock.mockResolvedValue({ ok: true, data: PREDICTION });
    render(<Classifier />);
    await selectFile(validFile());
    await userEvent.click(screen.getByRole("button", { name: "Analyze image" }));
    await waitFor(() => expect(screen.getByTestId("result-panel")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Analyze another image" }));
    expect(screen.getByText("Drop an oral image here")).toBeInTheDocument();
    expect(screen.queryByTestId("result-panel")).not.toBeInTheDocument();
  });
});
