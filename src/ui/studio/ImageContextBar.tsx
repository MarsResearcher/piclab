import { useRef } from 'react';
import { Circle, Crop, ImageIcon, Images, Square, Squircle } from 'lucide-react';
import type { ImageMask } from '../../studio';

type Props = {
  screenX: number;
  screenY: number;
  placement?: 'above' | 'below';
  mask?: ImageMask;
  onReplaceFile: (file: File) => void;
  onReplaceLibrary: () => void;
  onCrop: () => void;
  onMask: (mask: ImageMask) => void;
  cropDisabled?: boolean;
};

export function ImageContextBar({
  screenX,
  screenY,
  placement = 'above',
  mask = 'none',
  onReplaceFile,
  onReplaceLibrary,
  onCrop,
  onMask,
  cropDisabled,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`studio-image-context-bar glass is-${placement}`}
      style={{ left: screenX, top: screenY }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <label className="studio-img-ctx-btn" title="替换图片 · 本地文件">
        <ImageIcon size={14} strokeWidth={1.75} />
        <span>替换</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onReplaceFile(f);
            e.target.value = '';
          }}
        />
      </label>
      <button
        type="button"
        className="studio-img-ctx-btn"
        title="从图库替换"
        onClick={onReplaceLibrary}
      >
        <Images size={14} strokeWidth={1.75} />
        <span>图库</span>
      </button>
      <span className="studio-sel-sep" />
      <button
        type="button"
        className="studio-img-ctx-btn"
        title={cropDisabled ? '请先取消旋转再裁剪' : '裁剪图片'}
        disabled={cropDisabled}
        onClick={onCrop}
      >
        <Crop size={14} strokeWidth={1.75} />
        <span>裁剪</span>
      </button>
      <span className="studio-sel-sep" />
      <button
        type="button"
        className={`studio-img-ctx-btn ${mask === 'none' ? 'active' : ''}`}
        title="矩形"
        onClick={() => onMask('none')}
      >
        <Square size={14} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className={`studio-img-ctx-btn ${mask === 'ellipse' ? 'active' : ''}`}
        title="圆形遮罩"
        onClick={() => onMask('ellipse')}
      >
        <Circle size={14} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className={`studio-img-ctx-btn ${mask === 'roundRect' ? 'active' : ''}`}
        title="圆角遮罩"
        onClick={() => onMask('roundRect')}
      >
        <Squircle size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}
