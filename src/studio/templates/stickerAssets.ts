/**
 * Load / place bundled stickers (SVG → ImageData → ImageNode).
 */

import type { AssetStore } from '../store/assetStore';
import type { ImageNode, SceneNode } from '../model';
import { makeImageInRect } from './templateAssets';
import { STICKER_BY_ID, STICKER_CATALOG, type StickerId } from './stickerCatalog';

const mem = new Map<string, ImageData>();

function proceduralSticker(id: string, size = 256): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const hue = (id.length * 47) % 360;
  ctx.fillStyle = `hsl(${hue} 55% 72%)`;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1A1510';
  ctx.lineWidth = size * 0.04;
  ctx.stroke();
  ctx.fillStyle = '#1A1510';
  ctx.font = `bold ${Math.round(size * 0.14)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(id.slice(0, 4), size / 2, size / 2);
  return ctx.getImageData(0, 0, size, size);
}

async function decodeUrl(url: string): Promise<ImageData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`sticker ${url}: ${res.status}`);
  const blob = await res.blob();
  // SVG may need explicit type for createImageBitmap in some engines
  const typed =
    blob.type && blob.type !== 'application/octet-stream'
      ? blob
      : new Blob([await blob.arrayBuffer()], { type: 'image/svg+xml' });
  const bmp = await createImageBitmap(typed);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export async function loadSticker(id: string): Promise<ImageData> {
  const hit = mem.get(id);
  if (hit) return hit;
  const meta = STICKER_BY_ID[id];
  if (!meta) throw new Error(`Unknown sticker: ${id}`);
  const path = `/stickers/${meta.file}`;
  try {
    const data = await decodeUrl(path);
    mem.set(id, data);
    return data;
  } catch {
    const data = proceduralSticker(id);
    mem.set(id, data);
    return data;
  }
}

export function clearStickerCache(): void {
  mem.clear();
}

export function listStickerIds(): StickerId[] {
  return STICKER_CATALOG.map((s) => s.id);
}

export async function placeSticker(
  parentId: string,
  assets: AssetStore,
  id: string,
  x: number,
  y: number,
  opts?: { width?: number; deg?: number; locked?: boolean; opacity?: number },
): Promise<ImageNode> {
  const meta = STICKER_BY_ID[id];
  const image = await loadSticker(id);
  const w = opts?.width ?? meta?.defaultW ?? 80;
  const h = Math.round((w * image.height) / Math.max(1, image.width));
  const node = makeImageInRect(parentId, assets, image, x, y, w, h, {
    name: `\u8d34\u7eb8:${id}`,
    locked: opts?.locked ?? false,
    opacity: opts?.opacity ?? 1,
  });
  if (opts?.deg) {
    node.transform = {
      ...node.transform,
      rotation: (opts.deg * Math.PI) / 180,
    };
  }
  return node;
}

export type StickerSlot = {
  id: string;
  x: number;
  y: number;
  width?: number;
  deg?: number;
  opacity?: number;
};

/** Place several stickers (corners / accents). */
export async function scatterStickers(
  parentId: string,
  assets: AssetStore,
  slots: StickerSlot[],
): Promise<SceneNode[]> {
  const out: SceneNode[] = [];
  for (const slot of slots) {
    out.push(
      await placeSticker(parentId, assets, slot.id, slot.x, slot.y, {
        width: slot.width,
        deg: slot.deg,
        opacity: slot.opacity,
        locked: true,
      }),
    );
  }
  return out;
}
