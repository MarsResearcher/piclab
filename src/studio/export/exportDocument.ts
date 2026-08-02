import type { StudioDocument } from '../model';
import type { StudioRenderer } from '../engine/renderer';
import { getScene } from '../plugins/host';
import { applyBleed } from './bleed';
import { imageDataToJpegBlob, safeFilePart } from './imageEncode';
import { buildPdfFromJpegs, downloadBlob } from './pdfPages';
import { buildPagesZip } from './pagesZip';

/** Output pixel scale relative to frame size (1 = document px, 2 = 2× 高清, 3 = 3× 印刷). */
export type ExportPixelScale = 1 | 2 | 3;

export type ExportPagesOpts = {
  bleedMm?: number;
  /** Prefer scene exportHints[0].name as size tag in filenames. */
  useExportHints?: boolean;
  /** Raster scale for flatten (default 1). Higher = sharper, slower, larger files. */
  pixelScale?: ExportPixelScale;
  /** JPEG quality for PDF pages (0–1, default 0.92). */
  jpegQuality?: number;
};

function hintLabel(doc: StudioDocument): string | null {
  if (!doc.sceneId) return null;
  const scene = getScene(doc.sceneId);
  const hint = scene?.exportHints?.[0];
  return hint?.name ?? null;
}

export function flattenAllPages(
  renderer: StudioRenderer,
  doc: StudioDocument,
  opts?: ExportPagesOpts,
): Array<{ name: string; image: ImageData }> {
  const bleedMm = opts?.bleedMm ?? 0;
  const pixelScale = clampExportScale(opts?.pixelScale ?? 1);
  const tag = opts?.useExportHints !== false ? hintLabel(doc) : null;
  const out: Array<{ name: string; image: ImageData }> = [];

  for (const page of doc.pages) {
    const frameId = page.frameIds[0];
    if (!frameId) continue;
    let flat = renderer.flatten(doc, frameId, { pixelScale });
    if (!flat) continue;
    if (bleedMm > 0) {
      const frame = doc.nodes[frameId];
      const fillHex =
        frame && frame.type === 'frame' && frame.fill
          ? frame.fill
          : '#ffffff';
      // Scale bleed pad with export resolution so 3mm stays physically correct.
      flat = applyBleed(flat, bleedMm, {
        fill: hexToRgba(fillHex),
        dpi: 96 * pixelScale,
      });
    }
    const name = tag ? `${page.name}-${tag}` : page.name;
    out.push({ name, image: flat });
  }
  return out;
}

export function clampExportScale(scale: number): ExportPixelScale {
  if (scale >= 3) return 3;
  if (scale >= 2) return 2;
  return 1;
}

function hexToRgba(hex: string): [number, number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [255, 255, 255, 255];
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export async function exportAllPagesZip(
  renderer: StudioRenderer,
  doc: StudioDocument,
  projectName: string,
  opts?: ExportPagesOpts,
): Promise<number> {
  const pages = flattenAllPages(renderer, doc, opts);
  if (!pages.length) return 0;
  const base = safeFilePart(projectName || doc.name || 'piclab');
  const blob = await buildPagesZip(pages, { folderName: base });
  downloadBlob(blob, `${base}-pages.zip`);
  return pages.length;
}

export async function exportAllPagesPdf(
  renderer: StudioRenderer,
  doc: StudioDocument,
  projectName: string,
  opts?: ExportPagesOpts,
): Promise<number> {
  const pages = flattenAllPages(renderer, doc, opts);
  if (!pages.length) return 0;
  const jpegQuality = opts?.jpegQuality ?? 0.92;
  const pdfPages = [];
  for (const p of pages) {
    const jpegBlob = await imageDataToJpegBlob(p.image, jpegQuality);
    const jpeg = new Uint8Array(await jpegBlob.arrayBuffer());
    pdfPages.push({ jpeg, width: p.image.width, height: p.image.height });
  }
  const pdf = buildPdfFromJpegs(pdfPages);
  const base = safeFilePart(projectName || doc.name || 'piclab');
  downloadBlob(new Blob([pdf], { type: 'application/pdf' }), `${base}.pdf`);
  return pages.length;
}
