/** Backend base URL. Set NEXT_PUBLIC_API_URL per environment — never hardcoded. */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

/** Client-side pre-validation defaults; the backend re-validates everything. */
export const DEFAULT_MAX_UPLOAD_MB = 10;
export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".bmp"];
export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
];

export const DISCLAIMER =
  "Educational and research use only. This system is not a substitute for professional medical advice, diagnosis, or treatment.";
