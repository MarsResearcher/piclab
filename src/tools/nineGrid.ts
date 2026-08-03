import JSZip from 'jszip';
import { coverCrop } from './platformPresets';

/** Cut an image into a grid (default 3×3) and pack as zip of JPEG/PNG tiles. */
export async function cutGridZip(
  source: ImageData,
  cols: number,
  rows: number,
  format: 'png' | 'jpeg' = 'jpeg',
  quality = 0.92,
  square = true,
): Promise<Blob> {
  // For square tiles (social feeds), first cover-crop the image to the grid aspect
  const work = square
    ? coverCrop(source, cols * 1000, rows * 1000)
    : source;

  const tileW = Math.floor(work.width / cols);
  const tileH = Math.floor(work.height / rows);
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';

  const zip = new JSZip();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tile = new ImageData(tileW, tileH);
      for (let y = 0; y < tileH; y++) {
        const srcStart = (((row * tileH + y) * work.width) + col * tileW) * 4;
        tile.data.set(work.data.subarray(srcStart, srcStart + tileW * 4), y * tileW * 4);
      }
      const c = document.createElement('canvas');
      c.width = tileW;
      c.height = tileH;
      c.getContext('2d')!.putImageData(tile, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => {
        c.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
          mime,
          format === 'png' ? undefined : quality,
        );
      });
      const idx = row * cols + col + 1;
      zip.file(`${String(idx).padStart(2, '0')}-r${row + 1}c${col + 1}.${ext}`, blob);
    }
  }
  return zip.generateAsync({ type: 'blob' });
}
