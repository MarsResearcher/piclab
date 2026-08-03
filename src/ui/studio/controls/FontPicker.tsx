import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import {
  FONT_ROLE_GROUPS,
  STUDIO_FONT_CATALOG,
  fontsByRole,
  type FontOption,
} from '../../../studio/fonts/catalog';

type Props = {
  value: string;
  compact?: boolean;
  disabled?: boolean;
  onBegin?: () => void;
  onEnd?: () => void;
  /** Apply font — menu stays open for A/B comparison. */
  onChange: (fontFamily: string) => void;
};

type FlyoutPos = { top: number; left: number; width: number; openUp: boolean };

function resolveOption(value: string): FontOption {
  return (
    STUDIO_FONT_CATALOG.find((f) => f.value === value) ??
    STUDIO_FONT_CATALOG[0]!
  );
}

/** Short chip label: keep face name, drop long role tail when compact. */
function triggerLabel(opt: FontOption, compact: boolean): string {
  if (!compact) return opt.label;
  const head = opt.label.split('·')[0]?.trim();
  return head || opt.label;
}

export function FontPicker({
  value,
  compact,
  disabled,
  onBegin,
  onEnd,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<FlyoutPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = resolveOption(value);

  const close = () => {
    setOpen(false);
    onEnd?.();
  };

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const place = () => {
      const r = rootRef.current!.getBoundingClientRect();
      const flyH = flyoutRef.current?.offsetHeight ?? 360;
      const flyW = Math.min(
        compact ? 280 : 320,
        Math.max(r.width, compact ? 220 : 260),
        window.innerWidth - 16,
      );
      const spaceBelow = window.innerHeight - r.bottom - 12;
      const openUp = spaceBelow < Math.min(flyH, 280) && r.top > spaceBelow + 40;
      let left = r.left;
      if (left + flyW > window.innerWidth - 8) left = window.innerWidth - flyW - 8;
      if (left < 8) left = 8;
      setPos({
        top: openUp ? window.innerHeight - r.top + 8 : r.bottom + 6,
        left,
        width: flyW,
        openUp,
      });
    };
    place();
    requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, compact, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || flyoutRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close closes over latest onEnd
  }, [open, onEnd]);

  // Keep active row visible while browsing.
  useEffect(() => {
    if (!open || !flyoutRef.current) return;
    const el = flyoutRef.current.querySelector<HTMLElement>(
      '[data-font-active="true"]',
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, value]);

  const pick = (family: string) => {
    if (family === value) return;
    onBegin?.();
    onChange(family);
    // Intentionally keep open — compare fonts without reopening.
  };

  const flyout =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={flyoutRef}
            className={`studio-font-flyout ${pos?.openUp ? 'is-up' : 'is-down'}`}
            id={listId}
            role="listbox"
            aria-label={'\u5b57\u4f53'}
            style={
              pos
                ? {
                    position: 'fixed',
                    top: pos.openUp ? 'auto' : pos.top,
                    bottom: pos.openUp ? pos.top : 'auto',
                    left: pos.left,
                    width: pos.width,
                    zIndex: 220,
                  }
                : {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    visibility: 'hidden',
                    zIndex: 220,
                  }
            }
            onPointerDown={(e) => e.stopPropagation()}
          >
            <p className="studio-font-flyout-hint">
              {'\u70b9\u9009\u5373\u5e94\u7528\uff0c\u83dc\u5355\u4fdd\u6301\u6253\u5f00\u4ee5\u4fbf\u5bf9\u6bd4'}
            </p>
            <div className="studio-font-flyout-scroll">
              {FONT_ROLE_GROUPS.map((g) => {
                const fonts = fontsByRole(g.role);
                if (!fonts.length) return null;
                return (
                  <section key={g.role} className="studio-font-group">
                    <div className="studio-font-group-label">{g.label}</div>
                    {fonts.map((f) => {
                      const active = f.value === current.value;
                      const preview = f.sample || f.label;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          role="option"
                          aria-selected={active}
                          data-font-active={active ? 'true' : undefined}
                          className={`studio-font-option ${active ? 'active' : ''}`}
                          onClick={() => pick(f.value)}
                        >
                          <span
                            className="studio-font-option-face"
                            style={{ fontFamily: f.value }}
                          >
                            {preview}
                          </span>
                          <span className="studio-font-option-meta">
                            <span className="studio-font-option-name">
                              {f.label}
                              {f.bundled ? (
                                <span className="studio-font-option-badge" title="OFL · 可免费商用">
                                  {' '}
                                  商用
                                </span>
                              ) : null}
                            </span>
                            {active ? (
                              <Check size={14} strokeWidth={2} className="studio-font-option-check" />
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </section>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className={`studio-font-picker ${compact ? 'is-compact' : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="studio-font-trigger"
        disabled={disabled}
        aria-label={'\u5b57\u4f53'}
        aria-expanded={open}
        aria-controls={listId}
        title={current.label}
        onClick={() => {
          if (disabled) return;
          if (!open) {
            onBegin?.();
            setOpen(true);
          } else {
            close();
          }
        }}
      >
        <span
          className="studio-font-trigger-face"
          style={{ fontFamily: current.value }}
        >
          {triggerLabel(current, !!compact)}
        </span>
        <ChevronDown size={12} strokeWidth={2} className="studio-font-trigger-caret" />
      </button>
      {flyout}
    </div>
  );
}
