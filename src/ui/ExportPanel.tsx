import { useEffect, useState } from 'react';
import type { ExportFormat, ExportResult } from '../tools/exportImage';
import { exportImage, formatBytes } from '../tools/exportImage';

type Props = {
  imageData: ImageData | null;
  onClose: () => void;
};

export function ExportPanel({ imageData, onClose }: Props) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(0.92);
  const [maxWidth, setMaxWidth] = useState<number | ''>('');
  const [maxHeight, setMaxHeight] = useState<number | ''>('');
  const [preview, setPreview] = useState<ExportResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!imageData) return;
    let cancelled = false;
    setBusy(true);
    const t = window.setTimeout(async () => {
      try {
        const result = await exportImage(imageData, {
          format,
          quality,
          maxWidth: maxWidth === '' ? undefined : maxWidth,
          maxHeight: maxHeight === '' ? undefined : maxHeight,
        });
        if (!cancelled) {
          setPreview(result);
          setBusy(false);
        }
      } catch {
        if (!cancelled) setBusy(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [imageData, format, quality, maxWidth, maxHeight]);

  const download = () => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview.dataUrl;
    a.download = `piclab-${Date.now()}.${format === 'jpeg' ? 'jpg' : format}`;
    a.click();
  };

  return (
    <div className="export-panel glass">
      <header>
        <span>导出</span>
        <button type="button" className="close" onClick={onClose}>
          ×
        </button>
      </header>

      <div className="export-preview">
        {preview ? (
          <img src={preview.dataUrl} alt="preview" />
        ) : (
          <div className="placeholder">{busy ? '生成中…' : '无预览'}</div>
        )}
      </div>

      {preview && (
        <div className="export-meta">
          <span>
            {preview.width} × {preview.height}
          </span>
          <span>{formatBytes(preview.bytes)}</span>
          <span>{preview.mime}</span>
        </div>
      )}

      <div className="export-controls">
        <label>
          <span>格式</span>
          <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
            <option value="png">PNG（无损）</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
          </select>
        </label>

        {format !== 'png' && (
          <label>
            <span>质量 {Math.round(quality * 100)}%</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.01}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
          </label>
        )}

        <label>
          <span>最大宽度（可选）</span>
          <input
            type="number"
            placeholder="不限"
            value={maxWidth}
            onChange={(e) => setMaxWidth(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </label>
        <label>
          <span>最大高度（可选）</span>
          <input
            type="number"
            placeholder="不限"
            value={maxHeight}
            onChange={(e) => setMaxHeight(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </label>
      </div>

      <button
        type="button"
        className="btn primary"
        disabled={!preview || busy}
        onClick={download}
      >
        下载 {format.toUpperCase()}
      </button>
    </div>
  );
}
