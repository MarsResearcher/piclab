import { clamp } from '../lib/math';

export type AdjustParams = {
  brightness: number; // -1..1
  contrast: number; // -1..1
  saturation: number; // -1..1
  temperature: number; // -1..1  (cool → warm)
  vignette: number; // 0..1
  grain: number; // 0..1
};

export const DEFAULT_ADJUST: AdjustParams = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  vignette: 0,
  grain: 0,
};

export function isNeutralAdjust(p: AdjustParams): boolean {
  return (
    p.brightness === 0 &&
    p.contrast === 0 &&
    p.saturation === 0 &&
    p.temperature === 0 &&
    p.vignette === 0 &&
    p.grain === 0
  );
}

/** Single-pass photo adjust. Deterministic grain (seeded by pixel index). */
export function applyAdjust(source: ImageData, p: AdjustParams): ImageData {
  const { width: w, height: h, data } = source;
  const out = new ImageData(w, h);
  const dst = out.data;

  const b = p.brightness * 255;
  const c = p.contrast >= 0 ? 1 + p.contrast * 2 : 1 + p.contrast;
  const sat = 1 + p.saturation;
  const tempR = p.temperature * 24;
  const tempB = -p.temperature * 24;

  const cx = w / 2;
  const cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let r = data[i]!;
      let g = data[i + 1]!;
      let bl = data[i + 2]!;

      // brightness
      r += b;
      g += b;
      bl += b;

      // contrast around 128
      r = (r - 128) * c + 128;
      g = (g - 128) * c + 128;
      bl = (bl - 128) * c + 128;

      // saturation via luma
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      r = luma + (r - luma) * sat;
      g = luma + (g - luma) * sat;
      bl = luma + (bl - luma) * sat;

      // temperature
      r += tempR;
      bl += tempB;

      // vignette
      if (p.vignette > 0) {
        const dx = x - cx;
        const dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy) / maxDist;
        const v = 1 - p.vignette * d * d * 1.4;
        r *= v;
        g *= v;
        bl *= v;
      }

      // grain — hash-based deterministic noise
      if (p.grain > 0) {
        let n = (x * 374761393 + y * 668265263) | 0;
        n = (n ^ (n >> 13)) * 1274126177;
        const noise = (((n ^ (n >> 16)) & 0xff) / 255 - 0.5) * p.grain * 64;
        r += noise;
        g += noise;
        bl += noise;
      }

      dst[i] = clamp(Math.round(r), 0, 255);
      dst[i + 1] = clamp(Math.round(g), 0, 255);
      dst[i + 2] = clamp(Math.round(bl), 0, 255);
      dst[i + 3] = data[i + 3]!;
    }
  }
  return out;
}
