/**
 * Rasterize Lucide icon nodes / SVG URLs into ImageData for sticker ImageNodes.
 */

import { icons, type IconNode } from 'lucide';

export type LucideRasterOpts = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  pad?: number;
};

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

async function decodeSvgString(svg: string, pixelSize: number): Promise<ImageData> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const bmp = await createImageBitmap(await (await fetch(url)).blob());
    const canvas = document.createElement('canvas');
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.clearRect(0, 0, pixelSize, pixelSize);
    ctx.drawImage(bmp, 0, 0, pixelSize, pixelSize);
    bmp.close();
    return ctx.getImageData(0, 0, pixelSize, pixelSize);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function decodeSvgBlob(blob: Blob, pixelSize: number): Promise<ImageData> {
  const typed =
    blob.type && blob.type.includes('svg')
      ? blob
      : new Blob([await blob.arrayBuffer()], { type: 'image/svg+xml' });
  const bmp = await createImageBitmap(typed);
  const canvas = document.createElement('canvas');
  canvas.width = pixelSize;
  canvas.height = pixelSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, pixelSize, pixelSize);
  // letterbox contain
  const scale = Math.min(pixelSize / bmp.width, pixelSize / bmp.height);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  ctx.drawImage(bmp, (pixelSize - w) / 2, (pixelSize - h) / 2, w, h);
  bmp.close();
  return ctx.getImageData(0, 0, pixelSize, pixelSize);
}

export async function rasterLucideIcon(
  iconName: string,
  opts?: LucideRasterOpts,
): Promise<ImageData> {
  const pad = opts?.pad ?? 4;
  const size = opts?.size ?? 256;
  const inner = Math.max(16, size - pad * 2);
  const svg = lucideIconToSvg(iconName, {
    color: opts?.color,
    strokeWidth: opts?.strokeWidth,
  });
  // Draw into padded canvas for softer sticker feel
  const core = await decodeSvgString(svg, inner);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, size, size);
  const tmp = document.createElement('canvas');
  tmp.width = inner;
  tmp.height = inner;
  tmp.getContext('2d')!.putImageData(core, 0, 0);
  ctx.drawImage(tmp, pad, pad);
  return ctx.getImageData(0, 0, size, size);
}

export async function rasterSvgUrl(url: string, size = 320): Promise<ImageData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`illustration ${url}: ${res.status}`);
  const blob = await res.blob();
  return decodeSvgBlob(blob, size);
}

/** Tiny SVG data URL for editor shelf thumbs (no ImageData). */
export function lucideThumbDataUrl(
  iconName: string,
  opts?: { color?: string; strokeWidth?: number },
): string {
  const svg = lucideIconToSvg(iconName, opts);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
