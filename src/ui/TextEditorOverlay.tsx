import { useEffect, useRef } from 'react';
import type { TextStyle } from '../tools/textOverlay';
import type { ViewTransform } from '../core/canvasManager';

type Props = {
  open: boolean;
  style: TextStyle;
  view: ViewTransform;
  imageWidth: number;
  imageHeight: number;
  onChange: (next: TextStyle) => void;
  onClose: () => void;
  onCommit: () => void;
};

export function TextEditorOverlay({
  open,
  style,
  view,
  imageWidth,
  imageHeight,
  onChange,
  onClose,
  onCommit,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  if (!open || imageWidth <= 0) return null;

  const left = style.x * imageWidth * view.scale + view.offsetX;
  const top = style.y * imageHeight * view.scale + view.offsetY;
  const fontPx = Math.max(14, style.fontSize * view.scale);

  return (
    <div className="text-editor-overlay">
      <input
        ref={inputRef}
        className="text-editor-input"
        style={{
          left,
          top,
          fontSize: fontPx,
          color: style.color,
          fontWeight: style.bold ? 700 : 400,
          transform: 'translate(-50%, -50%)',
          textShadow: style.shadow ? '0 2px 8px rgba(0,0,0,0.55)' : 'none',
          WebkitTextStroke: style.strokeWidth > 0 ? `${Math.max(1, style.strokeWidth * view.scale * 0.35)}px ${style.strokeColor}` : undefined,
        }}
        value={style.content}
        placeholder="输入文字…"
        onChange={(e) => onChange({ ...style, content: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onCommit();
            onClose();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
      />
      <div className="text-editor-bar glass">
        <button type="button" className="btn" onClick={onClose}>
          完成编辑
        </button>
        <button type="button" className="btn primary" onClick={() => { onCommit(); onClose(); }}>
          固化文字
        </button>
      </div>
    </div>
  );
}
