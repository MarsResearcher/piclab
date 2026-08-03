/**
 * Rasterize Lucide icon nodes / SVG URLs into ImageData for sticker ImageNodes.
 *
 * Prefer direct Lucide → canvas painting (reliable). SVG URLs decode via HTMLImageElement
 * — createImageBitmap(SVG) is flaky in Chromium and previously fell back to blank circles.
 */

import { icons, type IconNode } from 'lucide';

export type LucideRasterOpts = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  pad?: number;
};

type SvgAttrs = Record<string, string | number>;

function escapeAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Convert Lucide IconNode to an SVG string (24 viewBox). */
export function lucideIconToSvg(
  iconName: string,
  opts?: { color?: string; strokeWidth?: number },
): string {
  const node = (icons as Record<string, IconNode>)[iconName];
  if (!node) throw new Error(`Unknown Lucide icon: ${iconName}`);
  const color = opts?.color ?? '#1A1510';
  const strokeWidth = opts?.strokeWidth ?? 2;
  const body = node
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${k}="${escapeAttr(String(v))}"`)
        .join(' ');
      return `<${tag} ${parts} />`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${escapeAttr(color)}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export function hasLucideIcon(iconName: string): boolean {
  return Boolean((icons as Record<string, IconNode>)[iconName]);
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (img.naturalWidth < 1 || img.naturalHeight < 1) {
        reject(new Error('SVG decoded with empty dimensions'));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 96)}`));
    img.src = src;
  });
}

/** Paint a Lucide icon into an existing 24×24 user-space context (caller scales). */
export function paintLucideIcon(
  ctx: CanvasRenderingContext2D,
  iconName: string,
  opts?: { color?: string; strokeWidth?: number },
): void {
  const node = (icons as Record<string, IconNode>)[iconName];
  if (!node) throw new Error(`Unknown Lucide icon: ${iconName}`);
  const color = opts?.color ?? '#1A1510';
  const strokeWidth = opts?.strokeWidth ?? 2;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  for (const [tag, raw] of node) {
    const attrs = raw as SvgAttrs;
    switch (tag) {
      case 'path': {
        const d = String(attrs.d ?? '');
        if (!d) break;
        const p = new Path2D(d);
        const fill = attrs.fill;
        if (fill && fill !== 'none') ctx.fill(p);
        ctx.stroke(p);
        break;
      }
      case 'circle': {
        ctx.beginPath();
        ctx.arc(
          Number(attrs.cx),
          Number(attrs.cy),
          Number(attrs.r),
          0,
          Math.PI * 2,
        );
        if (attrs.fill && attrs.fill !== 'none') ctx.fill();
        ctx.stroke();
        break;
      }
      case 'ellipse': {
        ctx.beginPath();
        ctx.ellipse(
          Number(attrs.cx),
          Number(attrs.cy),
          Number(attrs.rx),
          Number(attrs.ry),
          0,
          0,
          Math.PI * 2,
        );
        if (attrs.fill && attrs.fill !== 'none') ctx.fill();
        ctx.stroke();
        break;
      }
      case 'line': {
        ctx.beginPath();
        ctx.moveTo(Number(attrs.x1), Number(attrs.y1));
        ctx.lineTo(Number(attrs.x2), Number(attrs.y2));
        ctx.stroke();
        break;
      }
      case 'polyline':
      case 'polygon': {
        const pts = String(attrs.points ?? '')
          .trim()
          .split(/[\s,]+/)
          .map(Number)
          .filter((n) => Number.isFinite(n));
        if (pts.length < 4) break;
        ctx.beginPath();
        ctx.moveTo(pts[0]!, pts[1]!);
        for (let i = 2; i < pts.length; i += 2) {
          ctx.lineTo(pts[i]!, pts[i + 1]!);
        }
        if (tag === 'polygon') ctx.closePath();
        if (attrs.fill && attrs.fill !== 'none') ctx.fill();
        ctx.stroke();
        break;
      }
      case 'rect': {
        const x = Number(attrs.x ?? 0);
        const y = Number(attrs.y ?? 0);
        const w = Number(attrs.width ?? 0);
        const h = Number(attrs.height ?? 0);
        const rx = Number(attrs.rx ?? 0);
        ctx.beginPath();
        if (rx > 0 && typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, w, h, rx);
        } else {
          ctx.rect(x, y, w, h);
        }
        if (attrs.fill && attrs.fill !== 'none') ctx.fill();
        ctx.stroke();
        break;
      }
      default:
        break;
    }
  }
  ctx.restore();
}

async function decodeSvgViaImage(
  svgOrUrl: string,
  pixelSize: number,
  mode: 'string' | 'url',
): Promise<ImageData> {
  let objectUrl: string | null = null;
  try {
    const src =
      mode === 'url'
        ? svgOrUrl
        : (() => {
            objectUrl = URL.createObjectURL(
              new Blob([svgOrUrl], { type: 'image/svg+xml;charset=utf-8' }),
            );
            return objectUrl;
          })();
    const img = await loadHtmlImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.clearRect(0, 0, pixelSize, pixelSize);
    // contain letterbox
    const scale = Math.min(
      pixelSize / Math.max(1, img.naturalWidth),
      pixelSize / Math.max(1, img.naturalHeight),
    );
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.drawImage(img, (pixelSize - w) / 2, (pixelSize - h) / 2, w, h);
    const data = ctx.getImageData(0, 0, pixelSize, pixelSize);
    if (!imageDataHasInk(data)) {
      throw new Error('SVG raster produced empty pixels');
    }
    return data;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

function imageDataHasInk(data: ImageData): boolean {
  const px = data.data;
  for (let i = 3; i < px.length; i += 16) {
    if ((px[i] ?? 0) > 8) return true;
  }
  return false;
}

export async function rasterLucideIcon(
  iconName: string,
  opts?: LucideRasterOpts,
): Promise<ImageData> {
  if (!hasLucideIcon(iconName)) {
    throw new Error(`Unknown Lucide icon: ${iconName}`);
  }
  const pad = opts?.pad ?? 8;
  const size = opts?.size ?? 256;
  const inner = Math.max(16, size - pad * 2);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(pad, pad);
  ctx.scale(inner / 24, inner / 24);
  paintLucideIcon(ctx, iconName, {
    color: opts?.color,
    strokeWidth: opts?.strokeWidth,
  });
  ctx.restore();
  const data = ctx.getImageData(0, 0, size, size);
  if (!imageDataHasInk(data)) {
    // Fallback: SVG → <img> (still avoid createImageBitmap)
    const svg = lucideIconToSvg(iconName, {
      color: opts?.color,
      strokeWidth: opts?.strokeWidth,
    });
    return decodeSvgViaImage(svg, size, 'string');
  }
  return data;
}

export async function rasterSvgUrl(url: string, size = 320): Promise<ImageData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`illustration ${url}: ${res.status}`);
  const text = await res.text();
  if (!text.includes('<svg')) {
    throw new Error(`illustration ${url}: not SVG`);
  }
  return decodeSvgViaImage(text, size, 'string');
}

/** Tiny SVG data URL for editor shelf thumbs (no ImageData). */
export function lucideThumbDataUrl(
  iconName: string,
  opts?: { color?: string; strokeWidth?: number },
): string {
  const svg = lucideIconToSvg(iconName, opts);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
