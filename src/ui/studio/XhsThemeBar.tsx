import { useState } from 'react';
import {
  XHS_BG_META,
  XHS_PALETTES,
  XHS_SCALE_META,
  XHS_SKIN_META,
  type XhsBg,
  type XhsPaletteId,
  type XhsSkin,
  type XhsTheme,
  type XhsTypeScale,
} from '../../studio';

type Props = {
  theme: XhsTheme;
  onChange: (next: XhsTheme) => void;
  /** Sidebar layout: stacked rows, no canvas overlay. */
  variant?: 'dock' | 'sidebar';
};

/**
 * Xiaohongshu theme strip — skin × palette × bg × type scale.
 * Prefer sidebar variant so it never covers the canvas.
 */
export function XhsThemeBar({ theme, onChange, variant = 'sidebar' }: Props) {
  const [open, setOpen] = useState(true);
  const set = <K extends keyof XhsTheme>(key: K, value: XhsTheme[K]) => {
    onChange({ ...theme, [key]: value });
  };

  const skinLabel = XHS_SKIN_META.find((s) => s.id === theme.skin)?.label ?? theme.skin;
  const palLabel = XHS_PALETTES.find((p) => p.id === theme.palette)?.label ?? theme.palette;

  if (variant === 'sidebar') {
    return (
      <div className="studio-xhs-theme-side" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="studio-xhs-theme-side-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className="studio-xhs-theme-side-title">{'\u7b14\u8bb0\u4e3b\u9898'}</span>
          <span className="studio-xhs-theme-side-summary">
            {skinLabel} · {palLabel}
          </span>
          <span className="studio-xhs-theme-side-caret" aria-hidden>
            {open ? '\u25b2' : '\u25bc'}
          </span>
        </button>
        {open && (
          <div className="studio-xhs-theme-side-body">
            <div className="studio-xhs-theme-row">
              <span className="studio-xhs-theme-row-label">{'\u76ae\u80a4'}</span>
              <div className="studio-xhs-hook-chips" role="toolbar" aria-label="皮肤">
                {XHS_SKIN_META.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`studio-xhs-hook-chip ${theme.skin === s.id ? 'is-active' : ''}`}
                    onClick={() => set('skin', s.id as XhsSkin)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="studio-xhs-theme-row">
              <span className="studio-xhs-theme-row-label">{'\u914d\u8272'}</span>
              <div className="studio-xhs-hook-chips" role="toolbar" aria-label="配色">
                {XHS_PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`studio-xhs-hook-chip ${theme.palette === p.id ? 'is-active' : ''}`}
                    title={p.label}
                    onClick={() => set('palette', p.id as XhsPaletteId)}
                  >
                    <span
                      className="studio-xhs-style-dot"
                      style={{ background: p.accent, borderColor: p.ink }}
                      aria-hidden
                    />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="studio-xhs-theme-row">
              <span className="studio-xhs-theme-row-label">{'\u80cc\u666f'}</span>
              <div className="studio-xhs-hook-chips" role="toolbar" aria-label="背景">
                {XHS_BG_META.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`studio-xhs-hook-chip ${theme.bg === b.id ? 'is-active' : ''}`}
                    onClick={() => set('bg', b.id as XhsBg)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="studio-xhs-theme-row">
              <span className="studio-xhs-theme-row-label">{'\u5b57\u53f7'}</span>
              <div className="studio-xhs-hook-chips" role="toolbar" aria-label="字号">
                {XHS_SCALE_META.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`studio-xhs-hook-chip ${theme.typeScale === s.id ? 'is-active' : ''}`}
                    onClick={() => set('typeScale', s.id as XhsTypeScale)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Legacy compact dock (unused by default)
  return (
    <div className="studio-xhs-theme-bar glass" onPointerDown={(e) => e.stopPropagation()}>
      <span className="studio-xhs-hook-label">{'\u4e3b\u9898'}</span>
      <div className="studio-xhs-hook-chips" role="toolbar" aria-label="皮肤">
        {XHS_SKIN_META.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`studio-xhs-hook-chip ${theme.skin === s.id ? 'is-active' : ''}`}
            onClick={() => set('skin', s.id as XhsSkin)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
