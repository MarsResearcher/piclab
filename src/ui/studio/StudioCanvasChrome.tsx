import { Minus, Plus, Scan } from 'lucide-react';
import { POWERED_BY } from '../../appMeta';

type Props = {
  scale: number;
  onZoomBy: (factor: number) => void;
  onZoomTo: (scale: number) => void;
  onFit: () => void;
  appVersion: string;
};

export function StudioCanvasChrome({
  scale,
  onZoomBy,
  onZoomTo,
  onFit,
  appVersion,
}: Props) {
  const pct = Math.round(scale * 100);

  return (
    <div className="canvas-chrome">
      <div className="canvas-zoom glass">
        <button
          type="button"
          className="btn icon"
          title={'\u7f29\u5c0f'}
          onClick={() => onZoomBy(1 / 1.15)}
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          className="canvas-zoom-pct"
          title={'\u6062\u590d 100%'}
          onClick={() => onZoomTo(1)}
        >
          {pct}%
        </button>
        <button
          type="button"
          className="btn icon"
          title={'\u653e\u5927'}
          onClick={() => onZoomBy(1.15)}
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          className="btn icon"
          title={'\u9002\u5e94\u753b\u5e03'}
          onClick={onFit}
        >
          <Scan size={14} />
        </button>
      </div>
      <div className="canvas-brand-meta">
        <span>v{appVersion}</span>
        <span>Powered by {POWERED_BY}</span>
      </div>
    </div>
  );
}
