import { clamp } from '../lib/math';

export type AspectRatio = 'free' | '1:1' | '4:5' | '3:2' | '16:9' | '9:16';

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function aspectRatioValue(ratio: AspectRatio): number | null {
  switch (ratio) {
    case 'free':
      return null;
    case '1:1':
      return 1;
    case '4:5':
      return 4 / 5;
    case '3:2':
      return 3 / 2;
    case '16:9':
      return 16 / 9;
    case '9:16':
      return 9 / 16;
    default: {
      const _exhaustive: never = ratio;
      return _exhaustive;
    }
  }
}

/** Fit a crop rect inside image bounds, respecting aspect ratio. */
export function fitCropRect(
  imgW: number,
  imgH: number,
  rect: CropRect,
  ratio: AspectRatio,
): CropRect {
  const ar = aspectRatioValue(ratio);
  let { x, y, width, height } = rect;

  if (ar !== null) {
    // Adjust height to match ratio, centered
    const targetH = width / ar;
    const cy = y + height / 2;
    height = targetH;
    y = cy - height / 2;
  }

  // Clamp to image
  width = Math.min(width, imgW);
  height = Math.min(height, imgH);
  x = clamp(x, 0, imgW - width);
  y = clamp(y, 0, imgH - height);

  return { x, y, width, height };
}

/** Initial centered crop rect for a given ratio. */
export function defaultCrop(imgW: number, imgH: number, ratio: AspectRatio): CropRect {
  const ar = aspectRatioValue(ratio);
  if (ar === null) {
    const margin = Math.min(imgW, imgH) * 0.1;
    return {
      x: margin,
      y: margin,
      width: imgW - margin * 2,
      height: imgH - margin * 2,
    };
  }
  let width = imgW * 0.8;
  let height = width / ar;
  if (height > imgH * 0.8) {
    height = imgH * 0.8;
    width = height * ar;
  }
  return {
    x: (imgW - width) / 2,
    y: (imgH - height) / 2,
    width,
    height,
  };
}

/** Apply crop to ImageData. */
export function applyCrop(source: ImageData, rect: CropRect): ImageData {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const w = Math.min(source.width - x, Math.floor(rect.width));
  const h = Math.min(source.height - y, Math.floor(rect.height));
  const out = new ImageData(w, h);
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const si = ((y + dy) * source.width + (x + dx)) * 4;
      const di = (dy * w + dx) * 4;
      out.data[di] = source.data[si]!;
      out.data[di + 1] = source.data[si + 1]!;
      out.data[di + 2] = source.data[si + 2]!;
      out.data[di + 3] = source.data[si + 3]!;
    }
  }
  return out;
}
