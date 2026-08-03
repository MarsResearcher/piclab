import type { Experiment } from '../core/experiment';

type Props = {
  active: Experiment | null;
  hasImage: boolean;
  isStir: boolean;
  stirRadius: number;
  stirStrength: number;
  stirViscosity: number;
  onStirRadius: (v: number) => void;
  onStirStrength: (v: number) => void;
  onStirViscosity: (v: number) => void;
  onResetStir: () => void;
  onCommitStir: () => void;
  onCommitPlay: () => void;
  canCommitPlay: boolean;
};

export function PlayPanel({
  active,
  hasImage,
  isStir,
  stirRadius,
  stirStrength,
  stirViscosity,
  onStirRadius,
  onStirStrength,
  onStirViscosity,
  onResetStir,
  onCommitStir,
  onCommitPlay,
  canCommitPlay,
}: Props) {
  if (!active) {
    return (
      <section className="playground-card">
        <p>从左侧选一个玩法，在画布上动手。</p>
      </section>
    );
  }

  if (isStir) {
    return (
      <>
        <section className="playground-card">
          <p>{active.description}</p>
          <p className="hint">按住拖动水面；松开会慢慢回弹。离开玩法模式时未固化的水面会丢弃。</p>
        </section>

        <section className="stir-controls">
          <label className="param">
            <div className="param-head">
              <span>搅动半径</span>
              <span className="param-val">{stirRadius}</span>
            </div>
            <input
              type="range"
              min={10}
              max={160}
              step={1}
              value={stirRadius}
              onChange={(e) => onStirRadius(Number(e.target.value))}
            />
          </label>
          <label className="param">
            <div className="param-head">
              <span>力度</span>
              <span className="param-val">{stirStrength.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.05}
              value={stirStrength}
              onChange={(e) => onStirStrength(Number(e.target.value))}
            />
          </label>
          <label className="param">
            <div className="param-head">
              <span>粘度</span>
              <span className="param-val">{stirViscosity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={0.98}
              step={0.01}
              value={stirViscosity}
              onChange={(e) => onStirViscosity(Number(e.target.value))}
            />
          </label>
        </section>

        <div className="actions">
          <button type="button" className="btn" onClick={onResetStir} disabled={!hasImage}>
            重置水面
          </button>
          <button type="button" className="btn primary" onClick={onCommitStir} disabled={!hasImage}>
            固化水面到历史
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <section className="playground-card">
        <p>{active.description}</p>
        {active.interaction && <p className="hint">{active.interaction.hint}</p>}
        <p className="hint">玩法侧重手感。离开模式前请先固化，否则预览会丢弃。</p>
      </section>
      <div className="actions">
        <button
          type="button"
          className="btn primary"
          disabled={!hasImage || !canCommitPlay}
          onClick={onCommitPlay}
        >
          固化到历史
        </button>
      </div>
    </>
  );
}
