import { useEffect, useRef, useState } from 'react';
import type { AspectRatio, CropRect } from '../../tools/crop';
import { applyCrop, defaultCrop, fitCropRect } from '../../tools/crop';

type Props = {
  assetWidth: number;
  assetHeight: number;
  /** Image node bounds in screen (CSS) pixels */
  screenRect: { left: number; top: number; width: number; height: number };
  onApply: (rect: CropRect) => void;
  onCancel: () => void;
};

export function StudioCropOverlay({
  assetWidth,
  assetHeight,
  screenRect,
  onApply,
  onCancel,
}: Props) {
  const [ratio, setRatio] = useState<AspectRatio>('free');
  const [rect, setRect] = useState<CropRect>(() =>
    defaultCrop(assetWidth, assetHeight, 'free'),
  );
  const [drag, setDrag] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const dragStart = useRef({ x: 0, y: 0, rect: { x: 0, y: 0, width: 0, height: 0 } });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRect(defaultCrop(assetWidth, assetHeight, ratio));
  }, [ratio, assetWidth, assetHeight]);

  const scale = screenRect.width / assetWidth;

  const toAsset = (clientX: number, clientY: number) => {
    const el = overlayRef.current;
    if (!el) return { x: 0, y: 0 };
    const box = el.getBoundingClientRect();
    return {
      x: (clientX - box.left) / scale,
      y: (clientY - box.top) / scale,
    };
  };

  const startDrag = (e: React.PointerEvent, mode: typeof drag) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(mode);
    const p = toAsset(e.clientX, e.clientY);
    dragStart.current = { x: p.x, y: p.y, rect: { ...rect } };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = toAsset(e.clientX, e.clientY);
    const dx = p.x - dragStart.current.x;
    const dy = p.y - dragStart.current.y;
    const r = dragStart.current.rect;
    let next: CropRect = { ...r };

    switch (drag) {
      case 'move':
        next.x = r.x + dx;
        next.y = r.y + dy;
        break;
      case 'nw':
        next.x = r.x + dx;
        next.y = r.y + dy;
        next.width = r.width - dx;
        next.height = r.height - dy;
        break;
      case 'ne':
        next.y = r.y + dy;
        next.width = r.width + dx;
        next.height = r.height - dy;
        break;
      case 'sw':
        next.x = r.x + dx;
        next.width = r.width - dx;
        next.height = r.height + dy;
        break;
      case 'se':
        next.width = r.width + dx;
        next.height = r.height + dy;
        break;
      default: {
        const _e: never = drag;
        void _e;
      }
    }

    if (next.width < 8 || next.height < 8) return;
    setRect(fitCropRect(assetWidth, assetHeight, next, ratio));
  };

  const endDrag = () => setDrag(null);

  const tl = { x: rect.x * scale, y: rect.y * scale };
  const frameW = rect.width * scale;
  const frameH = rect.height * scale;

  const ratios: AspectRatio[] = ['free', '1:1', '4:5', '3:2', '16:9', '9:16'];

  return (
    <div
      ref={overlayRef}
      className="studio-crop-overlay"
      style={{
        left: screenRect.left,
        top: screenRect.top,
        width: screenRect.width,
        height: screenRect.height,
      }}
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="crop-frame"
        style={{ left: tl.x, top: tl.y, width: frameW, height: frameH }}
        onPointerDown={(e) => startDrag(e, 'move')}
      >
        <div className="crop-grid" />
        {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
          <div
            key={corner}
            className={`crop-handle ${corner}`}
            onPointerDown={(e) => startDrag(e, corner)}
          />
        ))}
      </div>

      <div className="crop-toolbar glass">
        <div className="crop-ratios">
          {ratios.map((r) => (
            <button
              key={r}
              type="button"
              className={r === ratio ? 'active' : ''}
              onClick={() => setRatio(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="crop-actions">
          <button type="button" className="btn" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="btn primary" onClick={() => onApply(rect)}>
            应用裁剪
          </button>
        </div>
      </div>
    </div>
  );
}

/** Crop asset pixels and return cropped ImageData. */
export function cropAssetPixels(source: ImageData, rect: CropRect): ImageData {
  return applyCrop(source, rect);
}
