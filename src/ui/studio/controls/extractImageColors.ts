/**
 * Quantize ImageData into a small editorial palette (bucket average).
 */

export type ImageColorPalette = {
  id: string;
  /** Optional tiny preview for the flyout. */
  thumbUrl?: string;
  colors: string[];
};

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function hexDist(a: string, b: string): number {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const dr = ((pa >> 16) & 255) - ((pb >> 16) & 255);
  const dg = ((pa >> 8) & 255) - ((pb >> 8) & 255);
  const db = (pa & 255) - (pb & 255);
  return dr * dr + dg * dg + db * db;
}

/**
 * Extract up to `maxColors` representative hexes from ImageData.
 * Skips near-transparent / near-gray noise when chromatic samples exist.
 */
export function extractColorsFromImageData(
  image: ImageData,
  maxColors = 8,
): string[] {
  const { data, width, height } = image;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 48));
  type Bucket = { r: number; g: number; b: number; n: number };
  const buckets = new Map<string, Bucket>();

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const a = data[i + 3]!;
      if (a < 40) continue;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      // 5-bit buckets keep palette compact.
      const key = `${r >> 3}_${g >> 3}_${b >> 3}`;
      const cur = buckets.get(key);
      if (cur) {
        cur.r += r;
        cur.g += g;
        cur.b += b;
        cur.n += 1;
      } else {
        buckets.set(key, { r, g, b, n: 1 });
      }
    }
  }

  const ranked = [...buckets.values()]
    .map((b) => ({
      hex: rgbToHex(
        Math.round(b.r / b.n),
        Math.round(b.g / b.n),
        Math.round(b.b / b.n),
      ),
      n: b.n,
    }))
    .sort((a, b) => b.n - a.n);

  const out: string[] = [];
  for (const row of ranked) {
    if (out.some((h) => hexDist(h, row.hex) < 900)) continue;
    out.push(row.hex);
    if (out.length >= maxColors) break;
  }
  return out;
}

export function imageDataThumbUrl(image: ImageData, maxSide = 48): string {
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const w = Math.max(1, Math.round(image.width * scale));
  const h = Math.max(1, Math.round(image.height * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const src = document.createElement('canvas');
  src.width = image.width;
  src.height = image.height;
  src.getContext('2d')!.putImageData(image, 0, 0);
  c.getContext('2d')!.drawImage(src, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.7);
}
