import { clamp } from './math';

export function convolve(
  source: ImageData,
  kernel: number[],
  kernelW: number,
  kernelH: number,
): ImageData {
  const { width, height, data } = source;
  const out = new Uint8ClampedArray(data.length);
  const halfW = (kernelW - 1) >> 1;
  const halfH = (kernelH - 1) >> 1;

  let kSum = 0;
  for (const k of kernel) kSum += k;
  const norm = kSum === 0 ? 1 : kSum;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let ky = 0; ky < kernelH; ky++) {
        const sy = clamp(y + ky - halfH, 0, height - 1);
        for (let kx = 0; kx < kernelW; kx++) {
          const sx = clamp(x + kx - halfW, 0, width - 1);
          const k = kernel[ky * kernelW + kx]!;
          const si = (sy * width + sx) * 4;
          r += data[si]! * k;
          g += data[si + 1]! * k;
          b += data[si + 2]! * k;
        }
      }
      const di = (y * width + x) * 4;
      out[di] = clamp(Math.round(r / norm), 0, 255);
      out[di + 1] = clamp(Math.round(g / norm), 0, 255);
      out[di + 2] = clamp(Math.round(b / norm), 0, 255);
      out[di + 3] = data[di + 3]!;
    }
  }

  return new ImageData(out, width, height);
}

export const PRESET_KERNELS: Record<string, { w: number; h: number; k: number[] }> = {
  identity: { w: 3, h: 3, k: [0, 0, 0, 0, 1, 0, 0, 0, 0] },
  sharpen: { w: 3, h: 3, k: [0, -1, 0, -1, 5, -1, 0, -1, 0] },
  edge: { w: 3, h: 3, k: [-1, -1, -1, -1, 8, -1, -1, -1, -1] },
  emboss: { w: 3, h: 3, k: [-2, -1, 0, -1, 1, 1, 0, 1, 2] },
  blur: { w: 3, h: 3, k: [1, 2, 1, 2, 4, 2, 1, 2, 1] },
  gaussian5: {
    w: 5,
    h: 5,
    k: [
      1, 4, 6, 4, 1,
      4, 16, 24, 16, 4,
      6, 24, 36, 24, 6,
      4, 16, 24, 16, 4,
      1, 4, 6, 4, 1,
    ],
  },
};
