import QRCode from 'qrcode';

export type QrLiteParams = {
  text: string;
  margin: number;
  /** QR module (dark) color */
  color: string;
  /** Background / light modules */
  lightColor?: string;
};

const DEFAULT_QR_SIZE = 512;

/** Generate a printable QR code as ImageData (PNG-ready pixels). */
export async function generateQrImageData(params: QrLiteParams): Promise<ImageData> {
  const text = params.text.trim() || ' ';
  const dataUrl = await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    width: DEFAULT_QR_SIZE,
    margin: Math.max(0, Math.min(8, params.margin)),
    color: {
      dark: params.color,
      light: params.lightColor ?? '#ffffff',
    },
  });
  const blob = await (await fetch(dataUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d unavailable');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
