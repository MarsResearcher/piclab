import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { QrLiteParams } from '../../studio/plugins/liteTools';

type Props = {
  onInsertQr: (params: QrLiteParams) => void;
  onInsertGradient: () => void;
  busy?: boolean;
};

export function LiteToolsPopover({ onInsertQr, onInsertGradient, busy }: Props) {
  const [text, setText] = useState('https://');
  const [margin, setMargin] = useState(2);
  const [color, setColor] = useState('#0b0c0e');

  return (
    <div className="lite-tools-pop">
      <div className="lite-tools-head">快捷工具</div>

      <div className="lite-tool-block">
        <div className="lite-tool-title">二维码</div>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">链接 / 文字</Label>
            <Input
              value={text}
              placeholder="URL 或任意文字"
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">边距 {margin}</Label>
            <Slider
              min={0}
              max={8}
              step={1}
              value={[margin]}
              disabled={busy}
              onValueChange={(v) => setMargin(v[0] ?? margin)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">颜色</Label>
            <Input
              type="color"
              className="h-8 p-1"
              value={color}
              disabled={busy}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn primary w-full"
            disabled={busy || !text.trim()}
            onClick={() => onInsertQr({ text, margin, color })}
          >
            插入二维码
          </button>
        </div>
      </div>

      <div className="lite-tool-divider" />

      <div className="lite-tool-block">
        <div className="lite-tool-title">渐变块</div>
        <p className="lite-tool-hint">插入可缩放的线性渐变图片块。</p>
        <button
          type="button"
          className="btn w-full"
          disabled={busy}
          onClick={onInsertGradient}
        >
          插入渐变块
        </button>
      </div>
    </div>
  );
}
