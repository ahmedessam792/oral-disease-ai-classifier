import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  DEFAULT_MAX_UPLOAD_MB,
} from "./config";

export interface ValidationFailure {
  code: "empty" | "extension" | "type" | "size";
  message: string;
}

/**
 * Fast pre-flight checks so obvious problems never leave the browser.
 * The backend independently re-validates everything, including image
 * integrity and dimensions.
 */
export function validateImageFile(
  file: File,
  maxUploadMb: number = DEFAULT_MAX_UPLOAD_MB,
): ValidationFailure | null {
  if (file.size === 0) {
    return { code: "empty", message: "That file is empty. Choose an image file." };
  }

  const dot = file.name.lastIndexOf(".");
  const extension = dot === -1 ? "" : file.name.slice(dot).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return {
      code: "extension",
      message: "Unsupported file type. Use a JPG, PNG, WEBP, or BMP image.",
    };
  }

  if (file.type && !ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      code: "type",
      message: "Unsupported file type. Use a JPG, PNG, WEBP, or BMP image.",
    };
  }

  if (file.size > maxUploadMb * 1024 * 1024) {
    return {
      code: "size",
      message: `File is larger than the ${maxUploadMb} MB limit. Choose a smaller image.`,
    };
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
