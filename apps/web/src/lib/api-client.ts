import { API_URL } from "./config";
import type {
  ApiClientError,
  ApiResult,
  HealthResponse,
  ModelInfoResponse,
  PredictionResponse,
} from "./types";

const REQUEST_TIMEOUT_MS = 30_000;

const NETWORK_ERROR: ApiClientError = {
  kind: "network",
  code: "NETWORK",
  message:
    "Can't reach the analysis service. Check your connection and try again.",
};

async function parseError(response: Response): Promise<ApiClientError> {
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred. Please try again.";
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string };
    };
    if (body.error?.code) code = body.error.code;
    if (body.error?.message) message = body.error.message;
  } catch {
    // Non-JSON error body — keep the generic message.
  }

  if (response.status === 503) {
    return { kind: "model_unavailable", code, message };
  }
  if (response.status === 400 || response.status === 413) {
    return { kind: "invalid_file", code, message };
  }
  return { kind: "server", code, message };
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }

  if (!response.ok) {
    return { ok: false, error: await parseError(response) };
  }
  try {
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

export function getHealth(): Promise<ApiResult<HealthResponse>> {
  return request<HealthResponse>("/health");
}

export function getModelInfo(): Promise<ApiResult<ModelInfoResponse>> {
  return request<ModelInfoResponse>("/api/v1/model/info");
}

export function predictImage(file: File): Promise<ApiResult<PredictionResponse>> {
  const form = new FormData();
  form.append("file", file);
  return request<PredictionResponse>("/api/v1/predict", {
    method: "POST",
    body: form,
  });
}
