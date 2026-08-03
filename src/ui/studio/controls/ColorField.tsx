import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pipette } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  COLOR_PALETTES,
  GRAPHITE_PALETTE,
  colorsEqual,
  normalizeHex,
} from './colorPresets';
import {
  getRecentColors,
  pushRecentColor,
  sanitizeRecentColors,
} from './recentColors';
import type { ImageColorPalette } from './extractImageColors';
import {
  GRADIENT_PRESETS,
  fillFromGradient,
  findGradientPreset,
  gradientCss,
} from './gradientPresets';
import {
  cssFillBackground,
  encodeLinearGradient,
  isLinearGradientFill,
  parseFill,
} from '../../../studio/paint/fillValue';

type Props = {
  label?: string;
  value: string;
  /**
   * Allow “none” (transparent) — fill without paint, stroke without outline.
   * Shows a checker chip in the palette, not only a text link.
   */
  allowTransparent?: boolean;
  /** Label for the none option (e.g. 无描边 / 无填充). Defaults to 无. */
  transparentLabel?: string;
  compact?: boolean;
  /** Palettes sampled from images currently on the canvas. */
  imagePalettes?: ImageColorPalette[];
  onBegin?: () => void;
  onEnd?: () => void;
  onChange: (hex: string) => void;
};

function toPickerValue(value: string): string {
  if (!value || value === 'transparent') return '#34D3C0';
  if (isLinearGradientFill(value)) {
    const preset = findGradientPreset(value);
    return preset?.stops[0] ?? '#34D3C0';
  }
  return normalizeHex(value) ?? '#34D3C0';
}

function isNone(value: string): boolean {
  return !value || value === 'transparent';
}

function paintsMatch(a: string, b: string): boolean {
  if (isLinearGradientFill(a) || isLinearGradientFill(b)) {
    return a.trim() === b.trim();
  }
  return colorsEqual(a, b);
}

function displayLabel(value: string, transparentLabel: string): string {
  if (isNone(value)) return transparentLabel;
  if (isLinearGradientFill(value)) {
    return findGradientPreset(value)?.name ?? '\u6e10\u53d8';
  }
  return toPickerValue(value);
}

type GradDraft = { angle: number; stops: string[] };

function seedGradDraft(value: string): GradDraft {
  const p = parseFill(value);
  if (p.kind === 'linear') {
    const stops = p.stops
      .map((s) => normalizeHex(s) ?? s)
      .filter(Boolean)
      .slice(0, 3);
    if (stops.length >= 2) {
      return { angle: Math.round(p.angleDeg) % 360, stops };
    }
  }
  const solid = normalizeHex(value) ?? '#2F6F4E';
  return { angle: 135, stops: [solid, '#FFFCF7'] };
}

function draftFill(d: GradDraft): string {
  return encodeLinearGradient(d.angle, d.stops);
}

type FlyoutPos = { top: number; left: number; openUp: boolean };

export function ColorField({
  label,
  value,
  allowTransparent,
  transparentLabel = '\u65e0',
  compact,
  imagePalettes,
  onBegin,
  onEnd,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState(toPickerValue(value));
  const [recent, setRecent] = useState<string[]>(() =>
    sanitizeRecentColors(getRecentColors()),
  );
  const [gradDraft, setGradDraft] = useState<GradDraft>(() => seedGradDraft(value));
  const [pos, setPos] = useState<FlyoutPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const none = isNone(value);
  const display = none ? 'transparent' : value;
  const hasImageColors = Boolean(imagePalettes?.some((p) => p.colors.length > 0));
  const swatchBg = none ? undefined : cssFillBackground(display);

  useEffect(() => {
    if (!open) setHexDraft(toPickerValue(value));
  }, [value, open]);

  useEffect(() => {
    if (open) setGradDraft(seedGradDraft(value));
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const place = () => {
      const r = rootRef.current!.getBoundingClientRect();
      const flyH = flyoutRef.current?.offsetHeight ?? 320;
      const flyW = Math.min(280, window.innerWidth - 16);
      const spaceBelow = window.innerHeight - r.bottom - 12;
      const openUp = spaceBelow < flyH && r.top > spaceBelow + 40;
      let left = r.left;
      if (left + flyW > window.innerWidth - 8) left = window.innerWidth - flyW - 8;
      if (left < 8) left = 8;
      setPos({
        top: openUp ? window.innerHeight - r.top + 8 : r.bottom + 6,
        left,
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
  }, [open, recent.length, hasImageColors]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || flyoutRef.current?.contains(t)) return;
      setOpen(false);
      onEnd?.();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        onEnd?.();
      }
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onEnd]);

  const commit = (paint: string, close = false) => {
    const isGrad = isLinearGradientFill(paint);
    const n = isGrad ? paint.trim() : normalizeHex(paint);
    if (!n) return;
    onBegin?.();
    onChange(n);
    setHexDraft(isGrad ? toPickerValue(n) : n);
    if (isGrad) setGradDraft(seedGradDraft(n));
    setRecent(pushRecentColor(n));
    if (close) {
      setOpen(false);
      onEnd?.();
    }
  };

  const commitGradDraft = (next: GradDraft, close = false) => {
    const stops = next.stops
      .map((s) => normalizeHex(s))
      .filter((s): s is string => Boolean(s));
    if (stops.length < 2) return;
    const cleaned = { angle: ((next.angle % 360) + 360) % 360, stops };
    setGradDraft(cleaned);
    commit(draftFill(cleaned), close);
  };

  const commitNone = (close = true) => {
    onBegin?.();
    onChange('transparent');
    if (close) {
      setOpen(false);
      onEnd?.();
    }
  };

  const morePalettes = COLOR_PALETTES.filter((p) => p.id !== GRAPHITE_PALETTE.id);

  const flyout =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={flyoutRef}
            className={`studio-color-flyout ${pos?.openUp ? 'is-up' : 'is-down'}`}
            id={panelId}
            role="dialog"
            aria-label={label ?? '\u989c\u8272'}
            style={
              pos
                ? {
                    position: 'fixed',
                    top: pos.openUp ? 'auto' : pos.top,
                    bottom: pos.openUp ? pos.top : 'auto',
                    left: pos.left,
                    zIndex: 200,
                  }
                : { position: 'fixed', top: 0, left: 0, visibility: 'hidden', zIndex: 200 }
            }
          >
            {allowTransparent && (
              <section className="studio-color-section">
                <div className="studio-color-flyout-head">
                  <span>{'\u5feb\u6377'}</span>
                </div>
                <div className="studio-color-quick">
                  <button
                    type="button"
                    className={`studio-color-chip is-none ${none ? 'active' : ''}`}
                    title={transparentLabel}
                    aria-label={transparentLabel}
                    onClick={() => commitNone()}
                  >
                    <span className="studio-color-none-mark" aria-hidden>
                      /
                    </span>
                  </button>
                </div>
              </section>
            )}

            {recent.length > 0 && (
              <section className="studio-color-section">
                <div className="studio-color-flyout-head">
                  <span>{'\u6700\u8fd1\u4f7f\u7528'}</span>
                </div>
                <div className="studio-color-quick">
                  {sanitizeRecentColors(recent).map((paint) => (
                    <button
                      key={paint}
                      type="button"
                      className={`studio-color-chip ${!none && paintsMatch(display, paint) ? 'active' : ''}`}
                      title={
                        isLinearGradientFill(paint)
                          ? (findGradientPreset(paint)?.name ?? '\u6e10\u53d8')
                          : paint
                      }
                      style={{ background: cssFillBackground(paint) }}
                      onClick={() => commit(paint)}
                    />
                  ))}
                </div>
              </section>
            )}

            {hasImageColors && (
              <section className="studio-color-section">
                <div className="studio-color-flyout-head">
                  <span>{'\u56fe\u7247\u8272\u5f69'}</span>
                </div>
                <div className="studio-color-image-palettes">
                  {imagePalettes!.map((pal) =>
                    pal.colors.length === 0 ? null : (
                      <div key={pal.id} className="studio-color-image-row">
                        {pal.thumbUrl ? (
                          <img
                            className="studio-color-image-thumb"
                            src={pal.thumbUrl}
                            alt=""
                          />
                        ) : null}
                        <div className="studio-color-quick is-image-extract">
                          {pal.colors.map((hex) => (
                            <button
                              key={`${pal.id}-${hex}`}
                              type="button"
                              className={`studio-color-chip ${!none && paintsMatch(display, hex) ? 'active' : ''}`}
                              title={hex}
                              style={{ background: hex }}
                              onClick={() => commit(hex)}
                            />
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}

            <section className="studio-color-section">
              <div className="studio-color-flyout-head">
                <span>{'\u6e10\u53d8\u8272\u5361'}</span>
                <span className="studio-color-flyout-hint">
                  {'\u70b9\u9009\u5e94\u7528\u6e10\u53d8'}
                </span>
              </div>
              <div className="studio-color-gradients">
                {GRADIENT_PRESETS.map((g) => {
                  const fill = fillFromGradient(g);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      className={`studio-color-gradient-chip ${!none && paintsMatch(display, fill) ? 'active' : ''}`}
                      title={g.name}
                      style={{ background: gradientCss(g) }}
                      onClick={() => commit(fill)}
                    />
                  );
                })}
              </div>
              <div className="studio-color-grad-editor">
                <div className="studio-color-flyout-head">
                  <span>{'\u81ea\u5b9a\u4e49\u6e10\u53d8'}</span>
                  <span className="studio-color-flyout-hint">{gradDraft.angle}&deg;</span>
                </div>
                <div
                  className="studio-color-grad-preview"
                  style={{ background: draftFill(gradDraft) }}
                  title={'\u9884\u89c8'}
                />
                <label className="studio-color-grad-angle">
                  <span>{'\u89d2\u5ea6'}</span>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={gradDraft.angle}
                    onPointerDown={() => onBegin?.()}
                    onChange={(e) =>
                      commitGradDraft({
                        ...gradDraft,
                        angle: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <div className="studio-color-grad-stops">
                  {gradDraft.stops.map((stop, i) => (
                    <label key={i} className="studio-color-grad-stop" title={`Stop ${i + 1}`}>
                      <input
                        type="color"
                        value={normalizeHex(stop) ?? '#888888'}
                        onPointerDown={() => onBegin?.()}
                        onChange={(e) => {
                          const next = [...gradDraft.stops];
                          next[i] = e.target.value;
                          commitGradDraft({ ...gradDraft, stops: next });
                        }}
                      />
                    </label>
                  ))}
                  {gradDraft.stops.length < 3 ? (
                    <button
                      type="button"
                      className="studio-color-grad-stop-btn"
                      title={'\u6dfb\u52a0\u8272\u6807'}
                      onClick={() => {
                        commitGradDraft({
                          ...gradDraft,
                          stops: [
                            gradDraft.stops[0]!,
                            '#8FA3B8',
                            gradDraft.stops[gradDraft.stops.length - 1]!,
                          ],
                        });
                      }}
                    >
                      +
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="studio-color-grad-stop-btn"
                      title={'\u79fb\u9664\u4e2d\u95f4\u8272\u6807'}
                      onClick={() =>
                        commitGradDraft({
                          ...gradDraft,
                          stops: [gradDraft.stops[0]!, gradDraft.stops[2]!],
                        })
                      }
                    >
                      −
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section className="studio-color-section">
              <div className="studio-color-flyout-head">
                <span>{GRAPHITE_PALETTE.name}</span>
                {allowTransparent && (
                  <button
                    type="button"
                    className="studio-color-clear"
                    onClick={() => commitNone()}
                  >
                    {transparentLabel}
                  </button>
                )}
              </div>
              <div className="studio-color-quick">
                {GRAPHITE_PALETTE.swatches.map((s) => (
                  <button
                    key={s.hex}
                    type="button"
                    className={`studio-color-chip ${!none && paintsMatch(display, s.hex) ? 'active' : ''}`}
                    title={s.label}
                    style={{ background: s.hex }}
                    onClick={() => commit(s.hex)}
                  />
                ))}
              </div>
            </section>

            <section className="studio-color-section">
              <div className="studio-color-flyout-head">
                <span>{'\u66f4\u591a\u8272\u677f'}</span>
              </div>
              <div className="studio-color-palettes">
                {morePalettes.map((pal) => (
                  <div key={pal.id} className="studio-color-palette">
                    <div className="studio-color-palette-name">
                      <span>{pal.name}</span>
                      {pal.mood ? (
                        <span className="studio-color-palette-mood">{pal.mood}</span>
                      ) : null}
                    </div>
                    <div className="studio-color-quick is-palette">
                      {pal.swatches.map((s) => (
                        <button
                          key={`${pal.id}-${s.hex}`}
                          type="button"
                          className={`studio-color-chip ${!none && paintsMatch(display, s.hex) ? 'active' : ''}`}
                          title={`${pal.name} · ${s.label}`}
                          style={{ background: s.hex }}
                          onClick={() => commit(s.hex)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="studio-color-section">
              <div className="studio-color-flyout-head">
                <span>{'\u81ea\u5b9a\u4e49'}</span>
              </div>
              <div className="studio-color-custom">
                <label className="studio-color-native" title={'\u53d6\u8272\u5668'}>
                  <Pipette size={14} strokeWidth={1.75} />
                  <input
                    type="color"
                    value={toPickerValue(display)}
                    onChange={(e) => commit(e.target.value)}
                  />
                </label>
                <Input
                  className="h-8 font-mono text-xs uppercase"
                  value={hexDraft}
                  maxLength={7}
                  placeholder="#RRGGBB"
                  onFocus={onBegin}
                  onChange={(e) => setHexDraft(e.target.value)}
                  onBlur={() => {
                    const n = normalizeHex(hexDraft);
                    if (n) commit(n);
                    else setHexDraft(toPickerValue(value));
                    onEnd?.();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const n = normalizeHex(hexDraft);
                      if (n) commit(n, true);
                    }
                  }}
                />
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`studio-color-field ${compact ? 'is-compact' : ''}`} ref={rootRef}>
      {label && !compact && <Label className="studio-color-field-label">{label}</Label>}
      <button
        type="button"
        className="studio-color-swatch-btn"
        title={label ?? '\u989c\u8272'}
        aria-label={label ?? '\u989c\u8272'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (!open) {
            setRecent(sanitizeRecentColors(getRecentColors()));
            onBegin?.();
          }
          setOpen((o) => !o);
        }}
      >
        <span
          className={`studio-color-swatch-face ${none ? 'is-transparent' : ''}`}
          style={none ? undefined : { background: swatchBg }}
        />
        {!compact && (
          <span className="studio-color-swatch-hex">
            {displayLabel(value, transparentLabel)}
          </span>
        )}
      </button>
      {flyout}
    </div>
  );
}
