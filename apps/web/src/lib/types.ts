/**
 * Mirrors the backend schemas in apps/api/app/schemas/prediction.py.
 * The contract is frozen — see docs/API_CONTRACT.md.
 */

export interface PredictionResponse {
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  model_name: string;
  model_version: string;
  /** True only for the development mock — the UI must label such results. */
  mock: boolean;
}

export interface ModelInfoResponse {
  model_name: string;
  model_version: string;
  framework: string;
  classes: string[];
  input_size: { width: number; height: number };
  confidence_threshold: number;
  max_upload_mb: number;
  mock: boolean;
  disclaimer: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  mode: "real" | "mock" | "unavailable";
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}

/** How the UI groups failures — each kind maps to a distinct state view. */
export type ApiErrorKind =
  | "invalid_file"
  | "model_unavailable"
  | "network"
  | "server";

export interface ApiClientError {
  kind: ApiErrorKind;
  code: string;
  message: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiClientError };
