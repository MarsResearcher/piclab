import type { ReactNode } from 'react';
import {
  ArrowRight,
  Circle,
  Eraser,
  Image as ImageIcon,
  Images,
  Layers2,
  Minus,
  MousePointer2,
  Package,
  PenTool,
  Square,
  Squircle,
  Star,
  Triangle,
  Type,
  Wrench,
} from 'lucide-react';
import type { InkBrush, ShapeKind } from '../../studio';
import type { QrLiteParams } from '../../studio/plugins/liteTools';
import { SampleStrip } from './SampleStrip';
import { StickerStrip } from './StickerStrip';
import { LiteToolsPopover } from './LiteToolsPopover';
import { IconBtn } from './IconBtn';
import { UI } from './uiLabels';
import { ColorField, PEN_WIDTH_PRESETS, StrokeWidthField } from './controls';

export type EditorToolId = 'select' | 'text' | 'pen' | 'eraser';

type Props = {
  tool: EditorToolId;
  layersOpen: boolean;
  assetsOpen: boolean;
  shapesOpen: boolean;
  toolsOpen: boolean;
  penOpen: boolean;
  liteToolsBusy: boolean;
  stripKey: number;
  penColor: string;
  penWidth: number;
  penBrush: InkBrush;
  onTool: (t: EditorToolId) => void;
  onToggleLayers: () => void;
  onToggleAssets: () => void;
  onToggleShapes: () => void;
  onToggleTools: () => void;
  onTogglePen: () => void;
  onPenColor: (c: string) => void;
  onPenWidth: (w: number) => void;
  onPenBrush: (b: InkBrush) => void;
  onInsertShape: (shape: ShapeKind) => void;
  onInsertBackground: () => void;
  onInsertQr: (params: QrLiteParams) => void;
  onInsertGradient: () => void;
  onOpenLibrary: () => void;
  onImportFile: (file: File) => void;
  onLoadSample: () => void;
  onPickSample: (blob: Blob, name: string, id: string) => void;
  onInsertSticker: (id: string) => void;
  onBakeInk?: () => void;
};

const SHAPES: { id: ShapeKind; label: string; icon: ReactNode }[] = [
  { id: 'rect', label: '\u77e9\u5f62', icon: <Square size={20} strokeWidth={1.6} /> },
  { id: 'roundRect', label: '\u5706\u89d2', icon: <Squircle size={20} strokeWidth={1.6} /> },
  { id: 'ellipse', label: '\u692d\u5706', icon: <Circle size={20} strokeWidth={1.6} /> },
  { id: 'triangle', label: '\u4e09\u89d2', icon: <Triangle size={20} strokeWidth={1.6} /> },
  { id: 'star', label: '\u661f\u5f62', icon: <Star size={20} strokeWidth={1.6} /> },
  { id: 'arrow', label: '\u7bad\u5934', icon: <ArrowRight size={20} strokeWidth={1.6} /> },
  { id: 'line', label: '\u76f4\u7ebf', icon: <Minus size={20} strokeWidth={1.6} /> },
];

const BRUSHES: { id: InkBrush; label: string }[] = [
  { id: 'pen', label: '\u94a2\u7b14' },
  { id: 'marker', label: '\u9a6c\u514b\u7b14' },
  { id: 'highlighter', label: '\u9ad8\u5149' },
];

export function StudioToolRail({
  tool,
  layersOpen,
  assetsOpen,
  shapesOpen,
  toolsOpen,
  penOpen,
  liteToolsBusy,
  stripKey,
  penColor,
  penWidth,
  penBrush,
  onTool,
  onToggleLayers,
  onToggleAssets,
  onToggleShapes,
  onToggleTools,
  onTogglePen,
  onPenColor,
  onPenWidth,
  onPenBrush,
  onInsertShape,
  onInsertBackground,
  onInsertQr,
  onInsertGradient,
  onOpenLibrary,
  onImportFile,
  onLoadSample,
  onPickSample,
  onInsertSticker,
  onBakeInk,
}: Props) {
  return (
    <aside className="studio-toolrail">
      <IconBtn
        className="rail-btn"
        active={tool === 'select'}
        label={UI.select}
        onClick={() => onTool('select')}
      >
        <MousePointer2 size={18} strokeWidth={1.75} />
      </IconBtn>
      <IconBtn
        className="rail-btn"
        active={tool === 'text'}
        label={`${UI.text} \u00b7 \u53cc\u51fb\u753b\u5e03`}
        onClick={() => onTool('text')}
      >
        <Type size={18} strokeWidth={1.75} />
      </IconBtn>

      <div className="rail-pop-wrap">
        <button
          type="button"
          className={`rail-btn ${tool === 'pen' || penOpen ? 'active' : ''}`}
          title={'\u753b\u7b14'}
          onClick={() => {
            onTool('pen');
            onTogglePen();
          }}
        >
          <PenTool size={18} strokeWidth={1.75} />
        </button>
        {penOpen && (
          <div className="rail-popover pen-pop glass">
            <div className="shape-pop-head">{'\u753b\u7b14'}</div>
            <div className="pen-brush-row">
              {BRUSHES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={penBrush === b.id ? 'active' : ''}
                  onClick={() => {
                    onPenBrush(b.id);
                    onTool('pen');
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <ColorField
              label={'\u989c\u8272'}
              value={penColor}
              onChange={onPenColor}
            />
            <StrokeWidthField
              label={'\u7c97\u7ec6'}
              value={penWidth}
              min={1}
              max={40}
              presets={PEN_WIDTH_PRESETS}
              onChange={onPenWidth}
            />
            <button
              type="button"
              className={`pen-eraser-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => onTool('eraser')}
            >
              <Eraser size={14} strokeWidth={1.75} />
              {'\u6a61\u76ae\uff08\u5220\u6574\u7b14\uff09'}
            </button>
            {onBakeInk && (
              <button type="button" className="pen-bake-btn" onClick={onBakeInk}>
                {'\u56fa\u5316\u4e3a\u7d20\u6750\u56fe'}
              </button>
            )}
            <p className="shape-pop-hint">
              {'\u5728\u753b\u5e03\u4e0a\u76f4\u63a5\u7ed8\u5236\uff1b\u56fa\u5316\u540e\u53ef\u5f53\u56fe\u7247\u4f7f\u7528'}
            </p>
          </div>
        )}
      </div>

      <div className="rail-pop-wrap">
        <button
          type="button"
          className={`rail-btn ${shapesOpen ? 'active' : ''}`}
          title={'\u5f62\u72b6'}
          onClick={onToggleShapes}
        >
          <Square size={18} strokeWidth={1.75} />
        </button>
        {shapesOpen && (
          <div className="rail-popover shapes-pop glass">
            <div className="shape-pop-head">{'\u63d2\u5165\u5f62\u72b6'}</div>
            <div className="shape-pop-grid">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="shape-pop-item"
                  title={s.label}
                  onClick={() => onInsertShape(s.id)}
                >
                  <span className="shape-pop-icon" aria-hidden>
                    {s.icon}
                  </span>
                  <span className="shape-pop-label">{s.label}</span>
                </button>
              ))}
            </div>
            <div className="shape-pop-divider" />
            <button type="button" className="shape-pop-bg" onClick={onInsertBackground}>
              {'\u94fa\u6ee1\u753b\u677f\u80cc\u666f'}
            </button>
          </div>
        )}
      </div>

      <div className="rail-pop-wrap">
        <button
          type="button"
          className={`rail-btn ${assetsOpen ? 'active' : ''}`}
          title={UI.images}
          onClick={onToggleAssets}
        >
          <ImageIcon size={18} strokeWidth={1.75} />
        </button>
        {assetsOpen && (
          <div className="rail-popover assets-pop glass">
            <div className="asset-pop-actions">
              <label className="btn icon" title={'\u5bfc\u5165'}>
                <ImageIcon size={15} />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onImportFile(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <button type="button" className="btn icon" title={'\u56fe\u5e93'} onClick={onOpenLibrary}>
                <Images size={15} />
              </button>
              <button type="button" className="btn icon" title={'\u793a\u4f8b\u56fe'} onClick={onLoadSample}>
                <Package size={15} />
              </button>
            </div>
            <SampleStrip refreshKey={stripKey} onPick={onPickSample} />
            <div className="shape-pop-divider" />
            <StickerStrip onPick={onInsertSticker} />
          </div>
        )}
      </div>

      <div className="rail-pop-wrap">
        <button
          type="button"
          className={`rail-btn ${toolsOpen ? 'active' : ''}`}
          title={UI.tools}
          onClick={onToggleTools}
        >
          <Wrench size={18} strokeWidth={1.75} />
        </button>
        {toolsOpen && (
          <div className="rail-popover tools-pop glass">
            <LiteToolsPopover
              busy={liteToolsBusy}
              onInsertQr={onInsertQr}
              onInsertGradient={onInsertGradient}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        className={`rail-btn ${layersOpen ? 'active' : ''}`}
        title={UI.layers}
        onClick={onToggleLayers}
      >
        <Layers2 size={18} strokeWidth={1.75} />
      </button>
    </aside>
  );
}
