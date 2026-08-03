export type TextStyle = {
  content: string;
  x: number; // 0..1 relative to image width
  y: number; // 0..1 relative to image height
  fontSize: number; // px, relative to image height fraction * image height
  color: string;
  strokeColor: string;
  strokeWidth: number; // px
  bold: boolean;
  align: CanvasTextAlign;
  shadow: boolean;
};

export const DEFAULT_TEXT: TextStyle = {
  content: '',
  x: 0.5,
  y: 0.5,
  fontSize: 48,
  color: '#ffffff',
  strokeColor: '#000000',
  strokeWidth: 6,
  bold: true,
  align: 'center',
  shadow: true,
};

/** Render text overlay onto a copy of the image. */
export function renderTextOverlay(source: ImageData, style: TextStyle): ImageData {
  const c = document.createElement('canvas');
  c.width = source.width;
  c.height = source.height;
  const ctx = c.getContext('2d')!;
  ctx.putImageData(source, 0, 0);

  if (style.content.trim()) {
    const weight = style.bold ? '700' : '400';
    ctx.font = `${weight} ${style.fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = style.align;
    ctx.textBaseline = 'middle';
    const x = style.x * source.width;
    const y = style.y * source.height;

    if (style.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = style.fontSize * 0.18;
      ctx.shadowOffsetY = style.fontSize * 0.05;
    }
    if (style.strokeWidth > 0) {
      ctx.lineWidth = style.strokeWidth;
      ctx.strokeStyle = style.strokeColor;
      ctx.lineJoin = 'round';
      ctx.strokeText(style.content, x, y);
    }
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = style.color;
    ctx.fillText(style.content, x, y);
  }

  return ctx.getImageData(0, 0, c.width, c.height);
}

/** Hit test: is image-space point near the text? Used for dragging. */
export function textHitTest(
  source: ImageData,
  style: TextStyle,
  px: number,
  py: number,
): boolean {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const weight = style.bold ? '700' : '400';
  ctx.font = `${weight} ${style.fontSize}px sans-serif`;
  const w = ctx.measureText(style.content).width;
  const tx = style.x * source.width;
  const ty = style.y * source.height;
  const halfW = Math.max(w / 2, 40);
  const halfH = Math.max(style.fontSize / 2, 30);
  return Math.abs(px - tx) <= halfW && Math.abs(py - ty) <= halfH;
}
