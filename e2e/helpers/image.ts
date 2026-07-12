/**
 * Generates a valid uncompressed 24-bit BMP entirely in memory, so no binary
 * fixtures live in the repo. BMP is in the API's allowlist and satisfies the
 * backend's 32px minimum dimension check.
 */
export function makeBmp(width = 64, height = 64): Buffer {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  const buffer = Buffer.alloc(fileSize);

  buffer.write("BM", 0);
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(54, 10); // pixel data offset
  buffer.writeUInt32LE(40, 14); // BITMAPINFOHEADER size
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(height, 22);
  buffer.writeUInt16LE(1, 26); // planes
  buffer.writeUInt16LE(24, 28); // bits per pixel
  buffer.writeUInt32LE(pixelDataSize, 34);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = 54 + y * rowSize + x * 3;
      buffer[offset] = 140; // B
      buffer[offset + 1] = (x * 3) % 256; // G — variation so mock output isn't flat
      buffer[offset + 2] = (y * 3) % 256; // R
    }
  }
  return buffer;
}

export const uploadPayload = (name = "sample.bmp") => ({
  name,
  mimeType: "image/bmp",
  buffer: makeBmp(),
});
