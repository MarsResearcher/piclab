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
};

/**
 * Xiaohongshu theme strip — skin × palette × bg × type scale.
 * Only shown when sceneId === xhsNote.
 */
export function XhsThemeBar({ theme, onChange }: Props) {
  const set = <K extends keyof XhsTheme>(key: K, value: XhsTheme[K]) => {
    onChange({ ...theme, [key]: value });
  };

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

      <span className="studio-sel-sep" />

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

      <span className="studio-sel-sep" />

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

      <span className="studio-sel-sep" />

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
  );
}
