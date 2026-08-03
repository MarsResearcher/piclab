/** Encode ImageData to PNG / JPEG blobs (browser). */

export function imageDataToCanvas(image: ImageData): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = image.width;
  c.height = image.height;
  c.getContext('2d')!.putImageData(image, 0, 0);
  return c;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('encode failed'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export async function imageDataToPngBlob(image: ImageData): Promise<Blob> {
  return canvasToBlob(imageDataToCanvas(image), 'image/png');
}

export async function imageDataToJpegBlob(
  image: ImageData,
  quality = 0.92,
): Promise<Blob> {
  return canvasToBlob(imageDataToCanvas(image), 'image/jpeg', quality);
}

export function safeFilePart(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'page';
}
