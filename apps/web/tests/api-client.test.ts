import { afterEach, describe, expect, it, vi } from "vitest";
import { getModelInfo, predictImage } from "@/lib/api-client";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const PREDICTION = {
  predicted_class: "Mock Class A",
  confidence: 0.61,
  probabilities: { "Mock Class A": 0.61, "Mock Class B": 0.39 },
  model_name: "mock-development-model",
  model_version: "0.0.0-mock",
  mock: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("predictImage", () => {
  it("returns data on success and posts multipart form data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, PREDICTION));
    vi.stubGlobal("fetch", fetchMock);

    const result = await predictImage(new File(["x"], "a.jpg", { type: "image/jpeg" }));
    expect(result).toEqual({ ok: true, data: PREDICTION });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/v1/predict");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("maps 503 to model_unavailable with the server message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(503, {
          error: { code: "MODEL_NOT_AVAILABLE", message: "The classification model is not available." },
        }),
      ),
    );
    const result = await predictImage(new File(["x"], "a.jpg", { type: "image/jpeg" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("model_unavailable");
      expect(result.error.code).toBe("MODEL_NOT_AVAILABLE");
      expect(result.error.message).toContain("not available");
    }
  });

  it("maps 400 and 413 to invalid_file", async () => {
    for (const [status, code] of [
      [400, "INVALID_IMAGE"],
      [413, "FILE_TOO_LARGE"],
    ] as const) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(jsonResponse(status, { error: { code, message: "nope" } })),
      );
      const result = await predictImage(new File(["x"], "a.jpg", { type: "image/jpeg" }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("invalid_file");
    }
  });

  it("maps thrown fetch errors to network", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("failed to fetch")));
    const result = await predictImage(new File(["x"], "a.jpg", { type: "image/jpeg" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("network");
  });

  it("maps 500 with a non-JSON body to a generic server error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>boom</html>", { status: 500 })),
    );
    const result = await predictImage(new File(["x"], "a.jpg", { type: "image/jpeg" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("server");
      expect(result.error.code).toBe("INTERNAL_ERROR");
    }
  });
});

describe("getModelInfo", () => {
  it("fetches the versioned model info route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { model_name: "m" }));
    vi.stubGlobal("fetch", fetchMock);
    await getModelInfo();
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/v1/model/info");
  });
});
