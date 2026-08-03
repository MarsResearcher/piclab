import { useEffect, useRef, useState } from 'react';
import type { AspectRatio, CropRect } from '../tools/crop';
import { defaultCrop, fitCropRect } from '../tools/crop';

type Props = {
  imageWidth: number;
  imageHeight: number;
  view: { scale: number; offsetX: number; offsetY: number };
  onApply: (rect: CropRect) => void;
  onCancel: () => void;
};

export function CropOverlay({ imageWidth, imageHeight, view, onApply, onCancel }: Props) {
  const [ratio, setRatio] = useState<AspectRatio>('free');
  const [rect, setRect] = useState<CropRect>(() => defaultCrop(imageWidth, imageHeight, 'free'));
  const [drag, setDrag] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const dragStart = useRef({ x: 0, y: 0, rect: { x: 0, y: 0, width: 0, height: 0 } });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRect(defaultCrop(imageWidth, imageHeight, ratio));
  }, [ratio, imageWidth, imageHeight]);

  const toScreen = (x: number, y: number) => ({
    x: x * view.scale + view.offsetX,
    y: y * view.scale + view.offsetY,
  });

  const toImage = (clientX: number, clientY: number) => {
    const el = overlayRef.current;
    if (!el) return { x: 0, y: 0 };
    const rectEl = el.getBoundingClientRect();
    return {
      x: (clientX - rectEl.left - view.offsetX) / view.scale,
      y: (clientY - rectEl.top - view.offsetY) / view.scale,
    };
  };

  const startDrag = (e: React.PointerEvent, mode: typeof drag) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(mode);
    const p = toImage(e.clientX, e.clientY);
    dragStart.current = { x: p.x, y: p.y, rect: { ...rect } };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = toImage(e.clientX, e.clientY);
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
        const _exhaustive: never = drag;
        void _exhaustive;
      }
    }

    if (next.width < 8 || next.height < 8) return;
    setRect(fitCropRect(imageWidth, imageHeight, next, ratio));
  };

  const endDrag = () => setDrag(null);

  const tl = toScreen(rect.x, rect.y);
  const br = toScreen(rect.x + rect.width, rect.y + rect.height);
  const w = br.x - tl.x;
  const h = br.y - tl.y;

  const ratios: AspectRatio[] = ['free', '1:1', '4:5', '3:2', '16:9', '9:16'];

  return (
    <div ref={overlayRef} className="crop-overlay" onPointerMove={onMove} onPointerUp={endDrag}>
      <div className="crop-dim" />
      <div
        className="crop-frame"
        style={{ left: tl.x, top: tl.y, width: w, height: h }}
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
          <button
            type="button"
            className="btn primary"
            onClick={() => onApply(rect)}
          >
            应用裁剪
          </button>
        </div>
      </div>
    </div>
  );
}
