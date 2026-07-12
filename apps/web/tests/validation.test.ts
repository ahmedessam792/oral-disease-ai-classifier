import { describe, expect, it } from "vitest";
import { formatFileSize, validateImageFile } from "@/lib/validation";

function makeFile(name: string, size: number, type: string): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateImageFile", () => {
  it("accepts a normal jpeg", () => {
    expect(validateImageFile(makeFile("scan.jpg", 500_000, "image/jpeg"))).toBeNull();
  });

  it("accepts png, webp, and bmp", () => {
    expect(validateImageFile(makeFile("a.png", 1000, "image/png"))).toBeNull();
    expect(validateImageFile(makeFile("a.webp", 1000, "image/webp"))).toBeNull();
    expect(validateImageFile(makeFile("a.bmp", 1000, "image/bmp"))).toBeNull();
  });

  it("rejects empty files", () => {
    expect(validateImageFile(makeFile("scan.jpg", 0, "image/jpeg"))?.code).toBe("empty");
  });

  it("rejects unsupported extensions", () => {
    expect(validateImageFile(makeFile("notes.txt", 100, "text/plain"))?.code).toBe("extension");
    expect(validateImageFile(makeFile("archive.gif", 100, "image/gif"))?.code).toBe("extension");
    expect(validateImageFile(makeFile("no-extension", 100, "image/jpeg"))?.code).toBe("extension");
  });

  it("rejects a mismatched mime type even with a valid extension", () => {
    expect(validateImageFile(makeFile("fake.jpg", 100, "application/pdf"))?.code).toBe("type");
  });

  it("rejects files over the size limit", () => {
    const elevenMb = 11 * 1024 * 1024;
    expect(validateImageFile(makeFile("big.jpg", elevenMb, "image/jpeg"))?.code).toBe("size");
  });

  it("respects a custom limit", () => {
    const twoMb = 2 * 1024 * 1024;
    expect(validateImageFile(makeFile("big.jpg", twoMb, "image/jpeg"), 1)?.code).toBe("size");
    expect(validateImageFile(makeFile("big.jpg", twoMb, "image/jpeg"), 5)).toBeNull();
  });
});

describe("formatFileSize", () => {
  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
