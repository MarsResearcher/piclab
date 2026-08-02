import { formatBytes } from './exportImage';

export type CompressResult = {
  blob: Blob;
  quality: number;
  bytes: number;
  width: number;
  height: number;
  scaledDown: boolean;
};

function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = imageData.width;
  c.height = imageData.height;
  c.getContext('2d')!.putImageData(imageData, 0, 0);
  return c;
}

function canvasToBlob(c: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      quality,
    );
  });
}

/**
 * Compress to a target byte budget (JPEG). Binary-searches quality first,
 * then progressively scales dimensions if quality floor isn't enough.
 */
export async function compressToSize(
  imageData: ImageData,
  targetBytes: number,
): Promise<CompressResult> {
  let scale = 1;

  for (let round = 0; round < 8; round++) {
    const w = Math.max(16, Math.round(imageData.width * scale));
    const h = Math.max(16, Math.round(imageData.height * scale));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageDataToCanvas(imageData), 0, 0, w, h);

    // Binary search quality in [0.3, 0.95]
    let lo = 0.3;
    let hi = 0.95;
    let best: Blob | null = null;
    let bestQ = 0.3;
    for (let i = 0; i < 7; i++) {
      const q = (lo + hi) / 2;
      const blob = await canvasToBlob(c, q);
      if (blob.size <= targetBytes) {
        best = blob;
        bestQ = q;
        lo = q;
      } else {
        hi = q;
      }
    }
    if (best) {
      return {
        blob: best,
        quality: bestQ,
        bytes: best.size,
        width: w,
        height: h,
        scaledDown: scale < 1,
      };
    }
    // Even lowest quality too big — shrink and retry
    scale *= 0.85;
  }

  // Give up: return smallest attempt
  const w = Math.max(16, Math.round(imageData.width * scale));
  const h = Math.max(16, Math.round(imageData.height * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d')!.drawImage(imageDataToCanvas(imageData), 0, 0, w, h);
  const blob = await canvasToBlob(c, 0.3);
  return { blob, quality: 0.3, bytes: blob.size, width: w, height: h, scaledDown: true };
}

export function parseTargetKB(input: string): number | null {
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 1024);
}

export { formatBytes };
