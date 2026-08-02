export type ExportFormat = 'png' | 'jpeg' | 'webp';

export type ExportOptions = {
  format: ExportFormat;
  quality: number; // 0..1, for jpeg/webp
  maxWidth?: number;
  maxHeight?: number;
};

export type ExportResult = {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
  mime: string;
};

function mimeOf(format: ExportFormat): string {
  switch (format) {
    case 'png':
      return 'image/png';
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}

export async function exportImage(
  imageData: ImageData,
  options: ExportOptions,
): Promise<ExportResult> {
  const { format, quality, maxWidth, maxHeight } = options;
  let { width, height } = imageData;

  // Scale down if needed
  if (maxWidth || maxHeight) {
    const scale = Math.min(
      maxWidth ? maxWidth / width : 1,
      maxHeight ? maxHeight / height : 1,
      1,
    );
    if (scale < 1) {
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
  }

  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d')!;

  // Draw scaled
  const src = document.createElement('canvas');
  src.width = imageData.width;
  src.height = imageData.height;
  src.getContext('2d')!.putImageData(imageData, 0, 0);
  ctx.drawImage(src, 0, 0, width, height);

  const mime = mimeOf(format);
  const blob = await new Promise<Blob>((resolve, reject) => {
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      mime,
      format === 'png' ? undefined : quality,
    );
  });

  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  return {
    blob,
    dataUrl,
    width,
    height,
    bytes: blob.size,
    mime,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
