/**
 * Load bundled HD photos from /template-assets for offline-capable L1 builds.
 * Same catalog is seeded into the local image library (see ensureTemplateStockInLibrary).
 */

import type { AssetStore } from '../store/assetStore';
import {
  createId,
  identityTransform,
  type ImageMask,
  type ImageNode,
} from '../model';
import {
  STOCK_BY_ID,
  STOCK_CATALOG,
  type TemplateAssetId,
} from './stockCatalog';

export type { TemplateAssetId } from './stockCatalog';

const mem = new Map<string, ImageData>();

function proceduralField(w: number, h: number, c0: string, c1: string): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, w * 0.2, h);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    d[i] = Math.max(0, Math.min(255, d[i]! + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1]! + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2]! + n));
  }
  return img;
}

const FALLBACK_COLORS: Record<string, [string, string]> = {
  hills: ['#2d5a3d', '#8fbc6b'],
  alpine: ['#1a3344', '#7a9ab0'],
  forest: ['#1a3a28', '#4a7a50'],
  ocean: ['#0a3a4a', '#6ab0c0'],
  desert: ['#c4a060', '#e8d0a0'],
  mist: ['#4a5560', '#a8b0b8'],
  snow: ['#d8e0e8', '#8a9aaa'],
  city: ['#0a0e1a', '#3a4a6b'],
  architecture: ['#2a3038', '#8a9098'],
  concrete: ['#6a6e74', '#c8ccd2'],
  street: ['#3a3a40', '#8a8a90'],
  bridge: ['#2a4a5a', '#80a0b0'],
  neon: ['#1a1020', '#c04080'],
  portrait: ['#2a2430', '#8a7060'],
  still: ['#3d2a1f', '#c4a574'],
  food: ['#3a5020', '#e8d080'],
  market: ['#4a3020', '#d08040'],
  flowers: ['#603040', '#e080a0'],
  fabric: ['#4a3040', '#b87890'],
  paper: ['#e8e2d4', '#b8a890'],
  stone: ['#505458', '#a8acb0'],
  product: ['#f0f0f0', '#303038'],
};

async function decodeUrl(url: string): Promise<ImageData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`asset ${url}: ${res.status}`);
  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Resolve a bundled template photo (cached). Falls back to procedural field. */
export async function loadTemplateAsset(id: TemplateAssetId): Promise<ImageData> {
  const hit = mem.get(id);
  if (hit) return hit;
  const meta = STOCK_BY_ID[id];
  if (!meta) {
    throw new Error(`Unknown template asset: ${id}`);
  }
  const path = `/template-assets/${meta.file}`;
  try {
    const data = await decodeUrl(path);
    mem.set(id, data);
    return data;
  } catch {
    const [a, b] = FALLBACK_COLORS[id] ?? ['#333', '#888'];
    const data = proceduralField(1600, 2000, a, b);
    mem.set(id, data);
    return data;
  }
}

/** Drop in-memory decode cache (e.g. after swapping asset files in dev). */
export function clearTemplateAssetCache(): void {
  mem.clear();
}

export function listTemplateAssetIds(): TemplateAssetId[] {
  return STOCK_CATALOG.map((s) => s.id);
}

/** Full-bleed cover into frame. */
export function makeCoverImage(
  parentId: string,
  assets: AssetStore,
  image: ImageData,
  frameW: number,
  frameH: number,
  opts?: { name?: string; opacity?: number; locked?: boolean },
): ImageNode {
  return makeImageInRect(parentId, assets, image, 0, 0, frameW, frameH, opts);
}

/** Place image in a specific rect with cover crop centered in that rect. */
export function makeImageInRect(
  parentId: string,
  assets: AssetStore,
  image: ImageData,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  opts?: {
    name?: string;
    mask?: ImageMask;
    maskRadius?: number;
    opacity?: number;
    locked?: boolean;
  },
): ImageNode {
  const scale = Math.max(boxW / image.width, boxH / image.height);
  const w = Math.round(image.width * scale);
  const h = Math.round(image.height * scale);
  const asset = assets.putImageData(image);
  return {
    id: createId('image'),
    name: opts?.name ?? '配图',
    type: 'image',
    visible: true,
    locked: opts?.locked ?? false,
    opacity: opts?.opacity ?? 1,
    parentId,
    transform: identityTransform(x + (boxW - w) / 2, y + (boxH - h) / 2),
    assetId: asset.id,
    width: w,
    height: h,
    ...(opts?.mask && opts.mask !== 'none' ? { mask: opts.mask } : {}),
    ...(opts?.maskRadius != null ? { maskRadius: opts.maskRadius } : {}),
  };
}
