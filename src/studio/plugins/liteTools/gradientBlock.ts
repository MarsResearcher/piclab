import { contentDefaults } from '../../contentDefaults';

/** Insert a simple linear gradient block as raster pixels. */
export function createGradientBlockImageData(
  width: number,
  height: number,
  colorA = contentDefaults.brandBar,
  colorB = contentDefaults.ellipseFill,
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d unavailable');
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, colorA);
  grad.addColorStop(1, colorB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}
