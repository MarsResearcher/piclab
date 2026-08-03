import { Label } from '@/components/ui/label';

export type StrokePreset = {
  value: number;
  label: string;
};

/** Includes “无” (0) — stroke is optional, not mandatory. */
const DEFAULT_PRESETS: StrokePreset[] = [
  { value: 0, label: '无' },
  { value: 1, label: '细' },
  { value: 2, label: '常规' },
  { value: 4, label: '中' },
  { value: 8, label: '粗' },
  { value: 14, label: '特粗' },
];

type Props = {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  presets?: StrokePreset[];
  compact?: boolean;
  onBegin?: () => void;
  onEnd?: () => void;
  onChange: (n: number) => void;
};

/** Visual stroke-weight chips (design-tool pattern: pick a weight icon, not only a slider). */
export function StrokeWidthField({
  label,
  value,
  min = 0,
  max = 40,
  presets = DEFAULT_PRESETS,
  compact,
  onBegin,
  onEnd,
  onChange,
}: Props) {
  const commit = (n: number) => {
    const next = Math.min(max, Math.max(min, Math.round(n)));
    onBegin?.();
    onChange(next);
    onEnd?.();
  };

  const nearest = presets.reduce((best, p) =>
    Math.abs(p.value - value) < Math.abs(best.value - value) ? p : best,
  );

  return (
    <div className={`studio-stroke-field ${compact ? 'is-compact' : ''}`}>
      {label && !compact && (
        <div className="studio-stroke-field-head">
          <Label>{label}</Label>
          <span className="studio-stroke-field-val">{Math.round(value)}</span>
        </div>
      )}
      <div className="studio-stroke-presets" role="listbox" aria-label={label ?? 'stroke width'}>
        {presets.map((p) => {
          const active =
            p.value === 0
              ? value <= 0.5
              : p.value === nearest.value && Math.abs(value - p.value) < 0.6 && value > 0.5;
          const thickness = p.value <= 0 ? 0 : Math.max(1, Math.min(10, p.value * 0.7));
          return (
            <button
              key={p.value}
              type="button"
              role="option"
              aria-selected={active}
              className={`studio-stroke-chip ${p.value === 0 ? 'is-none' : ''} ${active ? 'active' : ''}`}
              title={p.value === 0 ? p.label : `${p.label} · ${p.value}px`}
              onClick={() => commit(p.value)}
            >
              {p.value === 0 ? (
                <span className="studio-stroke-chip-none" aria-hidden>
                  /
                </span>
              ) : (
                <span
                  className="studio-stroke-chip-line"
                  style={{ height: thickness }}
                />
              )}
              {!compact && <span className="studio-stroke-chip-label">{p.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const PEN_WIDTH_PRESETS: StrokePreset[] = [
  { value: 2, label: '细' },
  { value: 4, label: '常规' },
  { value: 8, label: '中' },
  { value: 14, label: '粗' },
  { value: 22, label: '特粗' },
];

export const FONT_SIZE_PRESETS = [14, 18, 24, 32, 48, 64, 96] as const;

type FontSizeProps = {
  label?: string;
  value: number;
  onBegin?: () => void;
  onEnd?: () => void;
  onChange: (n: number) => void;
};

export function FontSizeChips({ label, value, onBegin, onEnd, onChange }: FontSizeProps) {
  const commit = (n: number) => {
    onBegin?.();
    onChange(n);
    onEnd?.();
  };
  return (
    <div className="studio-fontsize-field">
      {label && (
        <div className="studio-stroke-field-head">
          <Label>{label}</Label>
          <span className="studio-stroke-field-val">{Math.round(value)}</span>
        </div>
      )}
      <div className="studio-fontsize-chips">
        {FONT_SIZE_PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            className={`studio-fontsize-chip ${Math.round(value) === n ? 'active' : ''}`}
            onClick={() => commit(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
