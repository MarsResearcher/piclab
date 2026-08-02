import type { ParamDef, ParamValues } from '../core/experiment';

type Props = {
  params: ParamDef[];
  values: ParamValues;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
};

export function ParamsPanel({ params, values, onChange, disabled }: Props) {
  if (params.length === 0) {
    return <p className="hint">此实验无需参数 — 直接观察即可。</p>;
  }

  return (
    <div className="params-panel">
      {params.map((p) => (
        <ParamControl
          key={p.key}
          def={p}
          value={values[p.key]}
          disabled={disabled}
          onChange={(v) => onChange(p.key, v)}
        />
      ))}
    </div>
  );
}

function ParamControl({
  def,
  value,
  onChange,
  disabled,
}: {
  def: ParamDef;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}) {
  switch (def.type) {
    case 'number':
      return (
        <label className="param">
          <div className="param-head">
            <span>{def.label}</span>
            <span className="param-val">{formatNum(value)}</span>
          </div>
          <input
            type="range"
            min={def.min ?? 0}
            max={def.max ?? 1}
            step={def.step ?? 0.01}
            value={Number(value)}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {def.hint && <span className="hint">{def.hint}</span>}
        </label>
      );

    case 'boolean':
      return (
        <label className="param param-row">
          <span>{def.label}</span>
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
          />
          {def.hint && <span className="hint">{def.hint}</span>}
        </label>
      );

    case 'select':
      return (
        <label className="param">
          <div className="param-head">
            <span>{def.label}</span>
          </div>
          <select
            value={String(value)}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          >
            {(def.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {def.hint && <span className="hint">{def.hint}</span>}
        </label>
      );

    case 'color':
      return (
        <label className="param param-row">
          <span>{def.label}</span>
          <input
            type="color"
            value={String(value)}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );

    case 'matrix': {
      const rows = def.rows ?? 3;
      const cols = def.cols ?? 3;
      const matrix = Array.isArray(value) ? (value as number[]) : (def.default as number[]);
      return (
        <div className="param">
          <div className="param-head">
            <span>{def.label}</span>
          </div>
          <div
            className="matrix-grid"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: rows * cols }, (_, i) => (
              <input
                key={i}
                type="number"
                step={0.1}
                value={matrix[i] ?? 0}
                disabled={disabled}
                onChange={(e) => {
                  const next = matrix.slice();
                  next[i] = Number(e.target.value);
                  onChange(next);
                }}
              />
            ))}
          </div>
          {def.hint && <span className="hint">{def.hint}</span>}
        </div>
      );
    }

    case 'range2':
      return (
        <label className="param">
          <div className="param-head">
            <span>{def.label}</span>
          </div>
          <span className="hint">range2 控件待扩展</span>
        </label>
      );

    default: {
      const _exhaustive: never = def.type;
      return <span className="hint">未知参数类型: {_exhaustive}</span>;
    }
  }
}

function formatNum(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
