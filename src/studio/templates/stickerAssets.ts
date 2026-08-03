/**
 * Load / place stickers from Lucide (runtime) or Open Doodles illustrations.
 */

import type { AssetStore } from '../store/assetStore';
import type { ImageNode, SceneNode } from '../model';
import { publicUrl } from '../../lib/publicUrl';
import { makeImageInRect } from './templateAssets';
import { STICKER_BY_ID, STICKER_CATALOG, type StickerId } from './stickerCatalog';
import { hasLucideIcon, rasterLucideIcon, rasterSvgUrl } from './stickerRaster';

const mem = new Map<string, ImageData>();

export async function loadSticker(id: string): Promise<ImageData> {
  const hit = mem.get(id);
  if (hit) return hit;
  const meta = STICKER_BY_ID[id];
  if (!meta) throw new Error(`Unknown sticker: ${id}`);

  const src = meta.source;
  let data: ImageData;
  if (src.kind === 'lucide') {
    if (!hasLucideIcon(src.icon)) {
      throw new Error(`missing lucide ${src.icon}`);
    }
    data = await rasterLucideIcon(src.icon, {
      size: 256,
      color: src.color,
      strokeWidth: src.strokeWidth,
      pad: 8,
    });
  } else {
    data = await rasterSvgUrl(publicUrl(`illustrations/${src.file}`), 360);
  }
  mem.set(id, data);
  return data;
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
