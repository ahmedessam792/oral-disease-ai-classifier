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

/** The one safety statement in the product UI. Said once, in each place it
 *  matters, and never repeated back-to-back with itself. */
export const DISCLAIMER =
  "Arcus provides an AI classification result and is not a substitute for professional medical advice.";
