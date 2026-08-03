import { clamp } from './math';
import { luminance, rgbToHsv } from './color';

/** Draw text labels onto ImageData via an offscreen canvas. */
export function annotate(
  image: ImageData,
  labels: { text: string; x: number; y: number; color?: string }[],
): ImageData {
  const c = document.createElement('canvas');
  c.width = image.width;
  c.height = image.height;
  const ctx = c.getContext('2d');
  if (!ctx) return image;
  ctx.putImageData(image, 0, 0);
  ctx.font = `bold ${Math.max(11, Math.round(image.width / 28))}px "IBM Plex Mono", monospace`;
  ctx.textBaseline = 'top';
  for (const lab of labels) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const pad = 4;
    const w = ctx.measureText(lab.text).width + pad * 2;
    const h = Math.max(14, Math.round(image.width / 22));
    ctx.fillRect(lab.x, lab.y, w, h + pad);
    ctx.fillStyle = lab.color ?? '#c4f542';
    ctx.fillText(lab.text, lab.x + pad, lab.y + pad / 2);
  }
  return ctx.getImageData(0, 0, c.width, c.height);
}

/** Horizontal strip of three channel planes (each tinted or gray). */
export function channelStrip(
  source: ImageData,
  mode: 'rgb' | 'hsv' = 'rgb',
): ImageData {
  const { width: w, height: h, data } = source;
  const gap = 2;
  const out = new ImageData(w * 3 + gap * 2, h);
  out.data.fill(20);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      let c0: number, c1: number, c2: number;
      if (mode === 'hsv') {
        const hsv = rgbToHsv(r, g, b);
        c0 = (hsv.h / 360) * 255;
        c1 = hsv.s * 255;
        c2 = hsv.v * 255;
      } else {
        c0 = r;
        c1 = g;
        c2 = b;
      }

      const write = (ox: number, vr: number, vg: number, vb: number) => {
        const di = (y * out.width + ox + x) * 4;
        out.data[di] = vr;
        out.data[di + 1] = vg;
        out.data[di + 2] = vb;
        out.data[di + 3] = 255;
      };

      if (mode === 'rgb') {
        write(0, c0, 0, 0);
        write(w + gap, 0, c1, 0);
        write((w + gap) * 2, 0, 0, c2);
      } else {
        // H as hue wash, S/V as gray
        const hueRgb = hsvToRgbApprox(c0 / 255);
        write(0, hueRgb.r, hueRgb.g, hueRgb.b);
        write(w + gap, c1, c1, c1);
        write((w + gap) * 2, c2, c2, c2);
      }
    }
  }

  const labels =
    mode === 'rgb'
      ? [
          { text: 'R 红', x: 6, y: 6, color: '#ff6b6b' },
          { text: 'G 绿', x: w + gap + 6, y: 6, color: '#6bff8a' },
          { text: 'B 蓝', x: (w + gap) * 2 + 6, y: 6, color: '#6bb0ff' },
        ]
      : [
          { text: 'H 色相', x: 6, y: 6, color: '#ffd36b' },
          { text: 'S 饱和', x: w + gap + 6, y: 6, color: '#e8e4d8' },
          { text: 'V 明度', x: (w + gap) * 2 + 6, y: 6, color: '#e8e4d8' },
        ];

  return annotate(out, labels);
}

function hsvToRgbApprox(hNorm: number): { r: number; g: number; b: number } {
  const h = hNorm * 6;
  const x = 1 - Math.abs((h % 2) - 1);
  let r = 0, g = 0, b = 0;
  if (h < 1) [r, g, b] = [1, x, 0];
  else if (h < 2) [r, g, b] = [x, 1, 0];
  else if (h < 3) [r, g, b] = [0, 1, x];
  else if (h < 4) [r, g, b] = [0, x, 1];
  else if (h < 5) [r, g, b] = [x, 0, 1];
  else [r, g, b] = [1, 0, x];
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/** |filtered - original| as residual energy map (what the filter changed). */
export function residualMap(original: ImageData, filtered: ImageData): ImageData {
  const out = new ImageData(original.width, original.height);
  for (let i = 0; i < out.data.length; i += 4) {
    const dr = Math.abs(filtered.data[i]! - original.data[i]!);
    const dg = Math.abs(filtered.data[i + 1]! - original.data[i + 1]!);
    const db = Math.abs(filtered.data[i + 2]! - original.data[i + 2]!);
    const v = clamp(Math.round((dr + dg + db) * 1.2), 0, 255);
    // Hot residual
    out.data[i] = v;
    out.data[i + 1] = Math.round(v * 0.45);
    out.data[i + 2] = Math.round(v * 0.15);
    out.data[i + 3] = 255;
  }
  return annotate(out, [
    { text: '残差 |改动的地方|', x: 6, y: 6, color: '#ffb36b' },
  ]);
}

/** Overlay: dim image + highlight mask in accent. */
export function maskOverlay(source: ImageData, mask: Uint8Array): ImageData {
  const out = new ImageData(source.width, source.height);
  for (let p = 0, i = 0; p < mask.length; p++, i += 4) {
    const m = mask[p]!;
    const r = source.data[i]!;
    const g = source.data[i + 1]!;
    const b = source.data[i + 2]!;
    if (m) {
      out.data[i] = clamp(Math.round(r * 0.45 + 196 * 0.55), 0, 255);
      out.data[i + 1] = clamp(Math.round(g * 0.45 + 245 * 0.55), 0, 255);
      out.data[i + 2] = clamp(Math.round(b * 0.45 + 66 * 0.55), 0, 255);
    } else {
      const y = luminance(r, g, b) * 0.35;
      out.data[i] = y;
      out.data[i + 1] = y;
      out.data[i + 2] = y;
    }
    out.data[i + 3] = 255;
  }
  return annotate(out, [
    { text: '亮色 = 将被排序的像素', x: 6, y: 6 },
  ]);
}

/** Draw radial mask rings onto a spectrum image (display space). */
export function drawFreqMaskOverlay(
  spectrumImg: ImageData,
  mode: 'lowpass' | 'highpass' | 'bandpass' | 'bandstop',
  radiusPct: number,
  bandPct: number,
): ImageData {
  const c = document.createElement('canvas');
  c.width = spectrumImg.width;
  c.height = spectrumImg.height;
  const ctx = c.getContext('2d');
  if (!ctx) return spectrumImg;
  ctx.putImageData(spectrumImg, 0, 0);

  const cx = c.width / 2;
  const cy = c.height / 2;
  const maxR = Math.hypot(cx, cy);
  const r = (radiusPct / 100) * maxR;
  const bw = (bandPct / 100) * maxR;

  ctx.lineWidth = Math.max(1.5, c.width / 180);
  ctx.setLineDash([4, 4]);

  const ring = (radius: number, color: string) => {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  switch (mode) {
    case 'lowpass':
      ring(r, '#c4f542');
      ctx.fillStyle = 'rgba(196,245,66,0.08)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'highpass':
      ring(r, '#ff6b4a');
      break;
    case 'bandpass':
    case 'bandstop':
      ring(Math.max(1, r - bw / 2), '#6bb0ff');
      ring(r + bw / 2, '#6bb0ff');
      break;
    default: {
      const _exhaustive: never = mode;
      void _exhaustive;
    }
  }

  ctx.setLineDash([]);
  ctx.font = `bold ${Math.max(11, Math.round(c.width / 28))}px "IBM Plex Mono", monospace`;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(6, 6, 160, 22);
  ctx.fillStyle = '#c4f542';
  ctx.fillText('频谱 · 中心=低频', 10, 10);

  return ctx.getImageData(0, 0, c.width, c.height);
}
