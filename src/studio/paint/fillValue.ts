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
    const stops = m[2]!
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
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
      const n = Math.max(1, p.stops.length - 1);
      p.stops.forEach((stop, i) => {
        grad.addColorStop(i / n, stop);
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
