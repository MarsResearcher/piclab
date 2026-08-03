/**
 * Offline template / scene raster previews — no project create, no network.
 * Card thumbs stay small; modal uses a separate hi-res encode (not upscaled JPEG).
 */

import { StudioRenderer } from '../engine/renderer';
import { getScene } from '../plugins/host';
import type { SceneId, StudioDocument } from '../model';
import { AssetStore } from '../store/assetStore';
import { buildBuiltinDocument } from './builtins';

/** Bump when layouts or encode quality change. */
const CACHE_VER = 'v26';

const mem = new Map<string, string>();

export type PreviewQuality = 'thumb' | 'modal';

const QUALITY: Record<
  PreviewQuality,
  { maxEdge: number; mime: 'image/jpeg' | 'image/png'; jpegQ?: number }
> = {
  /** Grid cards only — small & fast. */
  thumb: { maxEdge: 420, mime: 'image/jpeg', jpegQ: 0.88 },
  /**
   * Modal lightbox — keep native document pixels (no downscale for typical
   * 1080×1920 boards). Cap only protects huge multi-page / print rasters.
   */
  modal: { maxEdge: 4096, mime: 'image/png' },
};

export async function imageDataToThumbDataUrl(
  flat: ImageData,
  quality: PreviewQuality = 'thumb',
): Promise<string> {
  const cfg = QUALITY[quality];
  const maxEdge = cfg.maxEdge;
  const scale = Math.min(1, maxEdge / Math.max(flat.width, flat.height));
  const w = Math.max(1, Math.round(flat.width * scale));
  const h = Math.max(1, Math.round(flat.height * scale));
  const src = document.createElement('canvas');
  src.width = flat.width;
  src.height = flat.height;
  src.getContext('2d')!.putImageData(flat, 0, 0);
  // Native size: encode source canvas directly (avoids an extra resample).
  if (w === flat.width && h === flat.height) {
    if (cfg.mime === 'image/png') return src.toDataURL('image/png');
    return src.toDataURL('image/jpeg', cfg.jpegQ ?? 0.9);
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  if (cfg.mime === 'image/png') return c.toDataURL('image/png');
  return c.toDataURL('image/jpeg', cfg.jpegQ ?? 0.9);
}

export async function renderDocumentThumb(
  doc: StudioDocument,
  assets?: AssetStore,
  quality: PreviewQuality = 'thumb',
): Promise<string | null> {
  const store = assets ?? new AssetStore();
  const renderer = new StudioRenderer(store);
  const flat = renderer.flatten(doc);
  if (!flat) return null;
  return imageDataToThumbDataUrl(flat, quality);
}

function cacheGet(key: string): string | null {
  const hit = mem.get(key);
  if (hit) return hit;
  // Only persist thumbs in sessionStorage — modal PNGs are large.
  if (key.includes(':modal:')) return null;
  try {
    const s = sessionStorage.getItem(key);
    if (s) {
      mem.set(key, s);
      return s;
    }
  } catch {
    /* private mode */
  }
  return null;
}

function cacheSet(key: string, url: string): void {
  mem.set(key, url);
  if (key.includes(':modal:')) return;
  try {
    sessionStorage.setItem(key, url);
  } catch {
    /* quota */
  }
}

async function buildSceneDoc(sceneId: SceneId): Promise<{
  doc: StudioDocument;
  assets: AssetStore;
} | null> {
  const scene = getScene(sceneId);
  if (!scene) return null;
  const assets = new AssetStore();
  try {
    const doc = scene.createDocument({
      assets,
      pageCount: 1,
      rows: 6,
      cols: 5,
      marginMm: 15,
    });
    return { doc, assets };
  } catch {
    return null;
  }
}

export async function getBuiltinPreviewThumb(
  templateId: string,
  quality: PreviewQuality = 'thumb',
): Promise<string | null> {
  const key = `tpl:${CACHE_VER}:${quality}:builtin:${templateId}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const assets = new AssetStore();
  const doc = await buildBuiltinDocument(templateId, { assets });
  if (!doc) return null;
  const url = await renderDocumentThumb(doc, assets, quality);
  if (url) cacheSet(key, url);
  return url;
}

export async function getScenePreviewThumb(
  sceneId: SceneId,
  quality: PreviewQuality = 'thumb',
): Promise<string | null> {
  const key = `tpl:${CACHE_VER}:${quality}:scene:${sceneId}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const built = await buildSceneDoc(sceneId);
  if (!built) return null;
  const url = await renderDocumentThumb(built.doc, built.assets, quality);
  if (url) cacheSet(key, url);
  return url;
}

/** Resolve hi-res modal preview for a template pick. */
export async function getPickPreviewHiRes(pick: {
  layer: string;
  templateId?: string;
  sceneId?: SceneId;
}): Promise<string | null> {
  if (pick.layer === 'builtin' && pick.templateId) {
    return getBuiltinPreviewThumb(pick.templateId, 'modal');
  }
  if (pick.layer === 'parametric' && pick.sceneId) {
    return getScenePreviewThumb(pick.sceneId, 'modal');
  }
  return null;
}

/** Warm card thumbs in background; yields between items. */
export async function warmTemplatePreviews(opts: {
  builtinIds: string[];
  sceneIds: SceneId[];
  onBuiltin?: (id: string, url: string | null) => void;
  onScene?: (id: SceneId, url: string | null) => void;
}): Promise<void> {
  for (const id of opts.builtinIds) {
    const url = await getBuiltinPreviewThumb(id, 'thumb');
    opts.onBuiltin?.(id, url);
    await new Promise((r) => setTimeout(r, 0));
  }
  for (const id of opts.sceneIds) {
    const url = await getScenePreviewThumb(id, 'thumb');
    opts.onScene?.(id, url);
    await new Promise((r) => setTimeout(r, 0));
  }
}
