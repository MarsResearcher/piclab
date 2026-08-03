import type { RefObject } from 'react';
import type { Experiment, ParamValues, Probe } from '../core/experiment';
import { ParamsPanel } from './paramsPanel';

type Props = {
  active: Experiment | null;
  hasImage: boolean;
  busy: boolean;
  narration: string;
  auxLabel: string;
  probeNotice: string;
  activeProbeId: string | null;
  showFineTune: boolean;
  params: ParamValues;
  auxCanvasRef: RefObject<HTMLCanvasElement | null>;
  onApplyProbe: (probe: Probe) => void;
  onParamChange: (key: string, value: unknown) => void;
  onToggleFineTune: () => void;
  onCompareHold: (on: boolean) => void;
  onCommit: () => void;
};

export function LearnPanel({
  active,
  hasImage,
  busy,
  narration,
  auxLabel,
  probeNotice,
  activeProbeId,
  showFineTune,
  params,
  auxCanvasRef,
  onApplyProbe,
  onParamChange,
  onToggleFineTune,
  onCompareHold,
  onCommit,
}: Props) {
  if (!active) {
    return (
      <section className="principle-card">
        <p>从左侧选一个原理模块，按①②③探测理解图像。</p>
      </section>
    );
  }

  return (
    <>
      <section className="principle-card">
        <h3>原理</h3>
        <p>{active.principle}</p>
        <ul className="observe-list">
          {active.observe.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="probes">
        <h3>试一试（按顺序）</h3>
        <div className="probe-list">
          {active.probes.map((probe) => (
            <button
              key={probe.id}
              type="button"
              className={`probe-chip ${activeProbeId === probe.id ? 'active' : ''}`}
              disabled={!hasImage || busy}
              onClick={() => onApplyProbe(probe)}
            >
              {probe.label}
            </button>
          ))}
        </div>
        {probeNotice && <p className="probe-notice">{probeNotice}</p>}
      </section>

      <section className="narration-card">
        <h3>此刻发生了什么</h3>
        <p>{narration || active.principle}</p>
      </section>

      <section className="aux-section">
        <h3>{auxLabel}</h3>
        <canvas ref={auxCanvasRef} className="aux-canvas" data-empty="1" />
      </section>

      <div className="actions">
        <button
          type="button"
          className="btn primary compare-btn"
          disabled={!hasImage}
          onPointerDown={() => onCompareHold(true)}
          onPointerUp={() => onCompareHold(false)}
          onPointerLeave={() => onCompareHold(false)}
        >
          按住对照原图（或空格）
        </button>
        <button
          type="button"
          className="btn"
          disabled={!hasImage || busy}
          onClick={onCommit}
        >
          固化到历史
        </button>
      </div>

      <button type="button" className="fine-toggle" onClick={onToggleFineTune}>
        {showFineTune ? '收起细调' : '细调参数（可选）'}
      </button>

      {showFineTune && (
        <ParamsPanel
          params={active.params}
          values={params}
          onChange={onParamChange}
          disabled={busy || !hasImage}
        />
      )}
    </>
  );
}
