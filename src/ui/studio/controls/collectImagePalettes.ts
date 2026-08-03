import type { AssetStore } from '../../../studio/store/assetStore';
import { isImage, type StudioDocument } from '../../../studio/model';
import {
  extractColorsFromImageData,
  imageDataThumbUrl,
  type ImageColorPalette,
} from './extractImageColors';

const paletteCache = new Map<string, ImageColorPalette>();

/** Build palettes for distinct image assets referenced by the document. */
export function collectImagePalettes(
  doc: StudioDocument | null | undefined,
  assets: AssetStore | null | undefined,
  maxAssets = 4,
): ImageColorPalette[] {
  if (!doc || !assets) return [];
  const seen = new Set<string>();
  const out: ImageColorPalette[] = [];
  for (const node of Object.values(doc.nodes)) {
    if (!isImage(node)) continue;
    const id = node.assetId;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const cached = paletteCache.get(id);
    if (cached) {
      out.push(cached);
    } else {
      const asset = assets.get(id);
      if (!asset) continue;
      const colors = extractColorsFromImageData(asset.imageData, 8);
      if (colors.length === 0) continue;
      const pal: ImageColorPalette = {
        id,
        thumbUrl: imageDataThumbUrl(asset.imageData),
        colors,
      };
      paletteCache.set(id, pal);
      out.push(pal);
    }
    if (out.length >= maxAssets) break;
  }
  return out;
}

export function clearImagePaletteCache(): void {
  paletteCache.clear();
}
