/**
 * Encode an image as a compact payload that can be embedded in QR / artifacts.
 * Format: [MAGIC(2)][W(1)][H(1)][PIX(0-3 bits) + optional palette]
 *
 * For tiny QR payloads we use 4×4→10×10 downscale + 8-color 3-bit palette.
 * Payload is binary; callers usually wrap in base64-url for QR text.
 */

export type Palette = number[];

export type EncodedImage = {
  width: number;
  height: number;
  palette: Palette;
  indices: Uint8Array;
  /** Base64-url of full payload (with header) */
  payload: string;
  bytes: number;
  /** The exact text the QR encodes (scan this to recover the image data) */
  scanText: string;
};

function buildPalette(source: ImageData, colors: number): { palette: Palette; indices: Uint8Array } {
  // Median-cut-ish: k-means on downsampled points, capped small
  const points: [number, number, number][] = [];
  const { width, height, data } = source;
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 1024)));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      points.push([data[i]!, data[i + 1]!, data[i + 2]!]);
    }
  }

  // Init centers by kmeans++
  const centers: [number, number, number][] = [];
  centers.push(points[Math.floor(Math.random() * points.length)] ?? [128, 128, 128]);
  while (centers.length < colors) {
    let best: [number, number, number] = [0, 0, 0];
    let bestDist = -1;
    for (const p of points) {
      let d = Infinity;
      for (const c of centers) {
        const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (dd < d) d = dd;
      }
      if (d > bestDist) {
        bestDist = d;
        best = p;
      }
    }
    centers.push(best);
  }

  // Iterate
  const assignments = new Int32Array(points.length);
  for (let iter = 0; iter < 8; iter++) {
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!;
      let best = 0;
      let bd = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const cc = centers[c]!;
        const dd = (p[0] - cc[0]) ** 2 + (p[1] - cc[1]) ** 2 + (p[2] - cc[2]) ** 2;
        if (dd < bd) {
          bd = dd;
          best = c;
        }
      }
      assignments[i] = best;
    }
    const sums = centers.map(() => [0, 0, 0, 0] as number[]);
    for (let i = 0; i < points.length; i++) {
      const a = assignments[i]!;
      const s = sums[a]!;
      s[0] += points[i]![0];
      s[1] += points[i]![1];
      s[2] += points[i]![2];
      s[3] += 1;
    }
    for (let c = 0; c < centers.length; c++) {
      const s = sums[c]!;
      if (s[3]! > 0) {
        centers[c] = [Math.round(s[0]! / s[3]!), Math.round(s[1]! / s[3]!), Math.round(s[2]! / s[3]!)];
      }
    }
  }

  // Assign every pixel
  const indices = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      let best = 0;
      let bd = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const cc = centers[c]!;
        const dd = (r - cc[0]) ** 2 + (g - cc[1]) ** 2 + (b - cc[2]) ** 2;
        if (dd < bd) {
          bd = dd;
          best = c;
        }
      }
      indices[y * width + x] = best;
    }
  }

  return { palette: centers.flat(), indices };
}

/** Resize to target grid (simple average) then quantize. */
export function encodeForQR(
  source: ImageData,
  targetSize = 8,
  paletteSize = 8,
): EncodedImage {
  const w = targetSize;
  const h = targetSize;
  const small = new ImageData(w, h);
  const { width: sw, height: sh, data } = source;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Box average over source region
      const x0 = Math.floor((x / w) * sw);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) / w) * sw));
      const y0 = Math.floor((y / h) * sh);
      const y1 = Math.max(y0 + 1, Math.floor(((y + 1) / h) * sh));
      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * sw + sx) * 4;
          r += data[i]!;
          g += data[i + 1]!;
          b += data[i + 2]!;
          n += 1;
        }
      }
      const di = (y * w + x) * 4;
      small.data[di] = Math.round(r / n);
      small.data[di + 1] = Math.round(g / n);
      small.data[di + 2] = Math.round(b / n);
      small.data[di + 3] = 255;
    }
  }

  const { palette, indices } = buildPalette(small, paletteSize);

  // Pack: header + palette + 3-bit indices
  const bitsPerIdx = paletteSize <= 2 ? 1 : paletteSize <= 4 ? 2 : 3;
  const byteLen = 4 + palette.length + Math.ceil((w * h * bitsPerIdx) / 8);
  const bytes = new Uint8Array(byteLen);
  bytes[0] = 0x50; // 'P'
  bytes[1] = 0x49; // 'I'
  bytes[2] = w;
  bytes[3] = h;
  bytes.set(palette, 4);

  let bitOffset = (4 + palette.length) * 8;
  for (let i = 0; i < w * h; i++) {
    const idx = indices[i]!;
    for (let b = bitsPerIdx - 1; b >= 0; b--) {
      const bit = (idx >> b) & 1;
      const byteIdx = bitOffset >> 3;
      const bitInByte = 7 - (bitOffset & 7);
      bytes[byteIdx]! |= bit << bitInByte;
      bitOffset += 1;
    }
  }

  // base64-url
  let bin = '';
  for (const byte of bytes) bin += String.fromCharCode(byte);
  const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return {
    width: w,
    height: h,
    palette,
    indices,
    payload: b64,
    bytes: byteLen,
    scanText: `PICLAB:${b64}`,
  };
}

export function decodePayload(b64: string): ImageData | null {
  try {
    const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    if (bytes[0] !== 0x50 || bytes[1] !== 0x49) return null;
    const w = bytes[2]!;
    const h = bytes[3]!;
    const paletteLen = 8 * 3; // fixed 8 colors
    const bitsPerIdx = 3;
    const palette = Array.from(bytes.subarray(4, 4 + paletteLen));
    const indices = new Uint8Array(w * h);
    let bitOffset = (4 + paletteLen) * 8;
    for (let i = 0; i < w * h; i++) {
      let idx = 0;
      for (let b = bitsPerIdx - 1; b >= 0; b--) {
        const byteIdx = bitOffset >> 3;
        const bitInByte = 7 - (bitOffset & 7);
        idx |= ((bytes[byteIdx]! >> bitInByte) & 1) << b;
        bitOffset += 1;
      }
      indices[i] = idx;
    }
    const out = new ImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const c = indices[i]! * 3;
      out.data[i * 4] = palette[c]!;
      out.data[i * 4 + 1] = palette[c + 1]!;
      out.data[i * 4 + 2] = palette[c + 2]!;
      out.data[i * 4 + 3] = 255;
    }
    return out;
  } catch {
    return null;
  }
}

/** Render palette as swatch strip ImageData */
export function paletteStrip(palette: Palette): ImageData {
  const colors = palette.length / 3;
  const w = colors * 16;
  const out = new ImageData(w, 24);
  for (let c = 0; c < colors; c++) {
    const r = palette[c * 3]!;
    const g = palette[c * 3 + 1]!;
    const b = palette[c * 3 + 2]!;
    for (let y = 0; y < 24; y++) {
      for (let x = c * 16; x < c * 16 + 16; x++) {
        const i = (y * w + x) * 4;
        out.data[i] = r;
        out.data[i + 1] = g;
        out.data[i + 2] = b;
        out.data[i + 3] = 255;
      }
    }
  }
  return out;
}

/** Reconstruct small ImageData from palette+indices, upscaled with pixelation */
export function reconstruct(encoded: EncodedImage, scale = 40): ImageData {
  const { width: w, height: h, palette, indices } = encoded;
  const out = new ImageData(w * scale, h * scale);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = indices[y * w + x]! * 3;
      const r = palette[c]!;
      const g = palette[c + 1]!;
      const b = palette[c + 2]!;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const dx = x * scale + sx;
          const dy = y * scale + sy;
          const i = (dy * out.width + dx) * 4;
          out.data[i] = r;
          out.data[i + 1] = g;
          out.data[i + 2] = b;
          out.data[i + 3] = 255;
        }
      }
    }
  }
  return out;
}
