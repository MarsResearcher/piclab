import { useState } from 'react';
import type { AdjustParams } from '../tools/adjust';
import { DEFAULT_ADJUST } from '../tools/adjust';
import type { TextStyle } from '../tools/textOverlay';
import { cutGridZip } from '../tools/nineGrid';
import { compressToSize, formatBytes, parseTargetKB } from '../tools/compress';
import type { CompressResult } from '../tools/compress';
import { FILTER_PRESETS } from '../tools/filterPresets';

type Props = {
  hasImage: boolean;
  disabled: boolean;
  adjust: AdjustParams;
  onAdjustChange: (next: AdjustParams) => void;
  onAdjustCommit: () => void;
  textStyle: TextStyle;
  onTextChange: (next: TextStyle) => void;
  onTextCommit: () => void;
  onStartTextEdit: () => void;
  getCurrentImage: () => ImageData | null;
  onStatus: (msg: string) => void;
  forceOpen?: 'adjust' | 'text' | 'grid' | 'compress' | null;
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="param">
      <div className="param-head">
        <span>{label}</span>
        <span className="param-val">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function ToolsPanel({
  hasImage,
  disabled,
  adjust,
  onAdjustChange,
  onAdjustCommit,
  textStyle,
  onTextChange,
  onTextCommit,
  onStartTextEdit,
  getCurrentImage,
  onStatus,
  forceOpen,
}: Props) {
  const [open, setOpen] = useState<'adjust' | 'text' | 'grid' | 'compress' | null>('adjust');
  const section = forceOpen !== undefined ? forceOpen : open;
  const [gridBusy, setGridBusy] = useState(false);
  const [targetKB, setTargetKB] = useState('500');
  const [compressBusy, setCompressBusy] = useState(false);
  const [compressResult, setCompressResult] = useState<CompressResult | null>(null);

  const off = disabled || !hasImage;

  const runGridCut = async () => {
    const img = getCurrentImage();
    if (!img) return;
    setGridBusy(true);
    try {
      const zip = await cutGridZip(img, 3, 3, 'jpeg', 0.92);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zip);
      a.download = `piclab-9grid-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      onStatus('九宫格已导出（9 张切片打包 ZIP）');
    } finally {
      setGridBusy(false);
    }
  };

  const runCompress = async () => {
    const img = getCurrentImage();
    const target = parseTargetKB(targetKB);
    if (!img || !target) return;
    setCompressBusy(true);
    setCompressResult(null);
    try {
      const result = await compressToSize(img, target);
      setCompressResult(result);
      onStatus(
        `压缩完成 · ${formatBytes(result.bytes)} · 质量 ${Math.round(result.quality * 100)}%${
          result.scaledDown ? ` · 缩到 ${result.width}×${result.height}` : ''
        }`,
      );
    } finally {
      setCompressBusy(false);
    }
  };

  const downloadCompressed = () => {
    if (!compressResult) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(compressResult.blob);
    a.download = `piclab-compressed-${Date.now()}.jpg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="tools-panel">
      {/* ---------- 调色台 ---------- */}
      <section className="tool-card">
        <button
          type="button"
          className={`tool-head ${section === 'adjust' ? 'open' : ''}`}
          onClick={() => setOpen(open === 'adjust' ? null : 'adjust')}
        >
          <span>调色 · 滤镜</span>
          <span className="tool-sub">一键风格 + 细调参数</span>
        </button>
        {section === 'adjust' && (
          <div className="tool-body">
            <div className="filter-presets">
              {FILTER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="filter-chip"
                  disabled={off}
                  onClick={() => onAdjustChange({ ...preset.adjust })}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <Slider label="亮度" value={adjust.brightness} min={-1} max={1} step={0.01}
              format={(v) => v.toFixed(2)}
              onChange={(v) => onAdjustChange({ ...adjust, brightness: v })} />
            <Slider label="对比度" value={adjust.contrast} min={-1} max={1} step={0.01}
              format={(v) => v.toFixed(2)}
              onChange={(v) => onAdjustChange({ ...adjust, contrast: v })} />
            <Slider label="饱和度" value={adjust.saturation} min={-1} max={1} step={0.01}
              format={(v) => v.toFixed(2)}
              onChange={(v) => onAdjustChange({ ...adjust, saturation: v })} />
            <Slider label="色温" value={adjust.temperature} min={-1} max={1} step={0.01}
              format={(v) => v.toFixed(2)}
              onChange={(v) => onAdjustChange({ ...adjust, temperature: v })} />
            <Slider label="暗角" value={adjust.vignette} min={0} max={1} step={0.01}
              format={(v) => v.toFixed(2)}
              onChange={(v) => onAdjustChange({ ...adjust, vignette: v })} />
            <Slider label="颗粒" value={adjust.grain} min={0} max={1} step={0.01}
              format={(v) => v.toFixed(2)}
              onChange={(v) => onAdjustChange({ ...adjust, grain: v })} />
            <div className="tool-actions">
              <button type="button" className="btn" disabled={off}
                onClick={() => onAdjustChange({ ...DEFAULT_ADJUST })}>
                归零
              </button>
              <button type="button" className="btn primary" disabled={off} onClick={onAdjustCommit}>
                固化调色
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ---------- 加字 ---------- */}
      <section className="tool-card">
        <button
          type="button"
          className={`tool-head ${section === 'text' ? 'open' : ''}`}
          onClick={() => setOpen(open === 'text' ? null : 'text')}
        >
          <span>文字</span>
          <span className="tool-sub">双击画布编辑 · 拖动定位</span>
        </button>
        {section === 'text' && (
          <div className="tool-body">
            <label className="tool-field">
              <span>内容</span>
              <input
                type="text"
                value={textStyle.content}
                onChange={(e) => onTextChange({ ...textStyle, content: e.target.value })}
                placeholder="输入文字，或双击画布"
              />
            </label>
            <Slider label="字号" value={textStyle.fontSize} min={12} max={200} step={1}
              onChange={(v) => onTextChange({ ...textStyle, fontSize: v })} />
            <div className="tool-row">
              <label className="tool-field">
                <span>颜色</span>
                <input type="color" value={textStyle.color}
                  onChange={(e) => onTextChange({ ...textStyle, color: e.target.value })} />
              </label>
              <label className="tool-field">
                <span>描边</span>
                <input type="color" value={textStyle.strokeColor}
                  onChange={(e) => onTextChange({ ...textStyle, strokeColor: e.target.value })} />
              </label>
              <label className="tool-field">
                <span>粗体</span>
                <input type="checkbox" checked={textStyle.bold}
                  onChange={(e) => onTextChange({ ...textStyle, bold: e.target.checked })} />
              </label>
              <label className="tool-field">
                <span>阴影</span>
                <input type="checkbox" checked={textStyle.shadow}
                  onChange={(e) => onTextChange({ ...textStyle, shadow: e.target.checked })} />
              </label>
            </div>
            <div className="tool-actions">
              <button type="button" className="btn" disabled={off} onClick={onStartTextEdit}>
                画布编辑
              </button>
              <button type="button" className="btn primary" disabled={off || !textStyle.content.trim()} onClick={onTextCommit}>
                固化文字
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ---------- 九宫格 ---------- */}
      <section className="tool-card">
        <button
          type="button"
          className={`tool-head ${section === 'grid' ? 'open' : ''}`}
          onClick={() => setOpen(open === 'grid' ? null : 'grid')}
        >
          <span>九宫格切图</span>
          <span className="tool-sub">切成 3×3 方形切片，打包 ZIP</span>
        </button>
        {section === 'grid' && (
          <div className="tool-body">
            <p className="hint">
              先把图裁成 3:4 / 1:1 构图，再切——每片自动按方形裁剪居中。按朋友圈发布顺序编号。
            </p>
            <div className="tool-actions">
              <button type="button" className="btn primary" disabled={off || gridBusy}
                onClick={() => void runGridCut()}>
                {gridBusy ? '切割中…' : '切 9 张并下载 ZIP'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ---------- 压到目标体积 ---------- */}
      <section className="tool-card">
        <button
          type="button"
          className={`tool-head ${section === 'compress' ? 'open' : ''}`}
          onClick={() => setOpen(open === 'compress' ? null : 'compress')}
        >
          <span>压到目标体积</span>
          <span className="tool-sub">平台传图限大小？二分质量 + 缩放</span>
        </button>
        {section === 'compress' && (
          <div className="tool-body">
            <label className="tool-field">
              <span>目标大小（KB）</span>
              <input type="number" value={targetKB} min={10}
                onChange={(e) => setTargetKB(e.target.value)} />
            </label>
            <div className="tool-actions">
              <button type="button" className="btn primary" disabled={off || compressBusy}
                onClick={() => void runCompress()}>
                {compressBusy ? '压缩中…' : '开始压缩'}
              </button>
              {compressResult && (
                <button type="button" className="btn" onClick={downloadCompressed}>
                  下载 {formatBytes(compressResult.bytes)}
                </button>
              )}
            </div>
            {compressResult && (
              <p className="hint">
                {compressResult.width}×{compressResult.height} · 质量{' '}
                {Math.round(compressResult.quality * 100)}%
                {compressResult.scaledDown ? ' · 已缩小尺寸' : ''}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
