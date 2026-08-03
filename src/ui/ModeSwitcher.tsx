import { APP_MODES, type AppMode } from '../core/appMode';

type Props = {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
};

export function ModeSwitcher({ mode, onChange }: Props) {
  return (
    <nav className="mode-switcher" aria-label="产品模式">
      {APP_MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={m.id === mode ? 'active' : ''}
          title={m.hint}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </nav>
  );
}
