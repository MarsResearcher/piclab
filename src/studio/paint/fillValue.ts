/**
 * Fill / paint strings stored on nodes.
 * - solid: `#RRGGBB`, `rgb(...)`, named colors, `transparent`
 * - linear: `linear-gradient(135deg, #aaa, #bbb, #ccc)`
 */

export type ParsedFill =
  | { kind: 'none' }
  | { kind: 'solid'; color: string }
  | { kind: 'linear'; angleDeg: number; stops: string[] };

const LINEAR_RE =
  /^linear-gradient\(\s*([+-]?\d+(?:\.\d+)?)deg\s*,\s*(.+)\s*\)$/i;

/** Split on top-level commas, respecting parentheses (so `rgba(...)` stops survive). */
export function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ',' && depth === 0) {
      parts.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(input.slice(start).trim());
  return parts.filter(Boolean);
}

const STOP_POS_RE = /^(.*?)\s+(\d+(?:\.\d+)?)%$/;

/**
 * A gradient stop may carry an optional position (`rgba(8,18,12,0.4) 42%`).
 * Returns the color plus a 0..1 position; stops without a position get -1
 * (caller distributes evenly).
 */
export function parseGradientStop(stop: string): { color: string; pos: number } {
  const m = STOP_POS_RE.exec(stop);
  if (m) {
    return { color: m[1]!.trim(), pos: Number(m[2]) / 100 };
  }
  return { color: stop.trim(), pos: -1 };
}

export function isLinearGradientFill(value: string): boolean {
  return LINEAR_RE.test(value.trim());
}

export function encodeLinearGradient(
  angleDeg: number,
  stops: readonly string[],
): string {
  return `linear-gradient(${angleDeg}deg, ${stops.join(', ')})`;
}

export function parseFill(value: string | undefined | null): ParsedFill {
  if (!value || value === 'transparent') return { kind: 'none' };
  const trimmed = value.trim();
  const m = LINEAR_RE.exec(trimmed);
  if (m) {
    const angleDeg = Number(m[1]);
    const stops = splitTopLevelCommas(m[2]!);
    if (stops.length >= 2 && Number.isFinite(angleDeg)) {
      return { kind: 'linear', angleDeg, stops };
    }
  }
  return { kind: 'solid', color: trimmed };
}

/** CSS `background` for swatches / chrome. */
export function cssFillBackground(value: string): string | undefined {
  const p = parseFill(value);
  switch (p.kind) {
    case 'none':
      return undefined;
    case 'solid':
      return p.color;
    case 'linear':
      return encodeLinearGradient(p.angleDeg, p.stops);
    default: {
      const _exhaustive: never = p;
      return _exhaustive;
    }
  }
}

/**
 * Map CSS gradient angle (0° = up) to canvas endpoints covering the box.
 */
function linearEndpoints(
  angleDeg: number,
  width: number,
  height: number,
): [number, number, number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  const x = Math.sin(rad);
  const y = -Math.cos(rad);
  const half = (Math.abs(width * x) + Math.abs(height * y)) / 2;
  const cx = width / 2;
  const cy = height / 2;
  return [cx - x * half, cy - y * half, cx + x * half, cy + y * half];
}

/** Canvas fillStyle / strokeStyle for a paint string. */
export function canvasPaintStyle(
  ctx: CanvasRenderingContext2D,
  value: string,
  width: number,
  height: number,
): string | CanvasGradient {
  const p = parseFill(value);
  switch (p.kind) {
    case 'none':
      return 'rgba(0,0,0,0)';
    case 'solid':
      return p.color;
    case 'linear': {
      const [x0, y0, x1, y1] = linearEndpoints(
        p.angleDeg,
        Math.max(1, width),
        Math.max(1, height),
      );
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      const parsed = p.stops.map(parseGradientStop);
      // Stops with explicit positions anchor the ramp; stops without one are
      // placed evenly between their nearest anchored neighbours (fallback:
      // evenly across the whole ramp when no anchor exists).
      const anchored = parsed
        .map((s, i) => ({ ...s, index: i }))
        .filter((s) => s.pos >= 0);
      const positions: number[] = new Array(parsed.length).fill(-1);
      if (anchored.length === 0) {
        parsed.forEach((_, i) => {
          positions[i] = parsed.length === 1 ? 0 : i / (parsed.length - 1);
        });
      } else {
        anchored.forEach((s) => {
          positions[s.index] = s.pos;
        });
        for (let i = 0; i < parsed.length; i++) {
          if (positions[i]! >= 0) continue;
          let beforeIdx = -1;
          for (let j = i - 1; j >= 0; j--) if (positions[j]! >= 0) { beforeIdx = j; break; }
          let afterIdx = -1;
          for (let j = i + 1; j < parsed.length; j++) if (positions[j]! >= 0) { afterIdx = j; break; }
          if (beforeIdx >= 0 && afterIdx >= 0) {
            const span = afterIdx - beforeIdx;
            const t = (i - beforeIdx) / span;
            positions[i] = positions[beforeIdx]! + t * (positions[afterIdx]! - positions[beforeIdx]!);
          } else if (beforeIdx >= 0) {
            positions[i] = positions[beforeIdx]!;
          } else if (afterIdx >= 0) {
            positions[i] = positions[afterIdx]!;
          }
        }
      }
      parsed.forEach((s, i) => {
        grad.addColorStop(Math.min(1, Math.max(0, positions[i] ?? 0)), s.color);
      });
      return grad;
    }
    default: {
      const _exhaustive: never = p;
      return _exhaustive;
    }
  }
}

export function hasVisibleFill(value: string | undefined | null): boolean {
  return parseFill(value).kind !== 'none';
}
