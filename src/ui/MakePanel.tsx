import type { AdjustParams } from '../tools/adjust';
import type { TextStyle } from '../tools/textOverlay';
import { ToolsPanel } from './ToolsPanel';

export type MakeTool = 'adjust' | 'text' | 'crop' | 'export';

type Props = {
  hasImage: boolean;
  busy: boolean;
  activeTool: MakeTool;
  onToolChange: (tool: MakeTool) => void;
  adjust: AdjustParams;
  onAdjustChange: (next: AdjustParams) => void;
  onAdjustCommit: () => void;
  textStyle: TextStyle;
  onTextChange: (next: TextStyle) => void;
  onTextCommit: () => void;
  onStartTextEdit: () => void;
  getCurrentImage: () => ImageData | null;
  onStatus: (msg: string) => void;
  onCrop: () => void;
  onExport: () => void;
  onBatch: () => void;
  onRotate: () => void;
  onFlip: () => void;
};

const TOOLS: { id: MakeTool; label: string }[] = [
  { id: 'adjust', label: '调色' },
  { id: 'text', label: '文字' },
  { id: 'crop', label: '裁剪' },
  { id: 'export', label: '导出' },
];

export function MakePanel({
  hasImage,
  busy,
  activeTool,
  onToolChange,
  adjust,
  onAdjustChange,
  onAdjustCommit,
  textStyle,
  onTextChange,
  onTextCommit,
  onStartTextEdit,
  getCurrentImage,
  onStatus,
  onCrop,
  onExport,
  onBatch,
  onRotate,
  onFlip,
}: Props) {
  return (
    <div className="make-panel">
      <nav className="make-toolstrip" aria-label="编辑工具">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={activeTool === t.id ? 'active' : ''}
            disabled={!hasImage && t.id !== 'adjust'}
            onClick={() => {
              onToolChange(t.id);
              if (t.id === 'crop') onCrop();
              if (t.id === 'export') onExport();
              if (t.id === 'text') onStartTextEdit();
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="make-quick">
        <div className="actions">
          <button type="button" className="btn" disabled={!hasImage} onClick={onRotate} title="旋转 90°">
            ⟳ 旋转
          </button>
          <button type="button" className="btn" disabled={!hasImage} onClick={onFlip} title="水平翻转">
            ⇋ 翻转
          </button>
          <button type="button" className="btn" disabled={!hasImage} onClick={onBatch}>
            批量平台
          </button>
        </div>
      </section>

      <ToolsPanel
        hasImage={hasImage}
        disabled={busy}
        adjust={adjust}
        onAdjustChange={onAdjustChange}
        onAdjustCommit={onAdjustCommit}
        textStyle={textStyle}
        onTextChange={onTextChange}
        onTextCommit={onTextCommit}
        onStartTextEdit={onStartTextEdit}
        getCurrentImage={getCurrentImage}
        onStatus={onStatus}
        forceOpen={activeTool === 'adjust' || activeTool === 'text' ? activeTool : null}
      />
    </div>
  );
}
