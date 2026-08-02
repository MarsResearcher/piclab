/**
 * Print bleed helpers. 1 mm ≈ px at given DPI (default 96 for A4 scenes).
 */

export const MM_PER_INCH = 25.4;

export function mmToPx(mm: number, dpi = 96): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/**
 * Expand ImageData with a solid bleed margin (outer ring filled with `fill`).
 * Content is centered; bleed grows canvas on all sides.
 */
export function applyBleed(
  image: ImageData,
  bleedMm: number,
  opts?: { dpi?: number; fill?: [number, number, number, number] },
): ImageData {
  const dpi = opts?.dpi ?? 96;
  const pad = mmToPx(bleedMm, dpi);
  if (pad <= 0) return image;

  const fill = opts?.fill ?? [255, 255, 255, 255];
  const w = image.width + pad * 2;
  const h = image.height + pad * 2;
  const out = new ImageData(w, h);
  const dst = out.data;
  const [r, g, b, a] = fill;
  for (let i = 0; i < dst.length; i += 4) {
    dst[i] = r;
    dst[i + 1] = g;
    dst[i + 2] = b;
    dst[i + 3] = a;
  }

  const src = image.data;
  for (let y = 0; y < image.height; y++) {
    const srcRow = y * image.width * 4;
    const dstRow = ((y + pad) * w + pad) * 4;
    dst.set(src.subarray(srcRow, srcRow + image.width * 4), dstRow);
  }
  return out;
}
