import { colorsEqual, normalizeHex } from './colorPresets';
import {
  isLinearGradientFill,
  parseFill,
} from '../../../studio/paint/fillValue';

const STORAGE_KEY = 'piclab-recent-colors';
const MAX_RECENT = 12;

function normalizePaint(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (isLinearGradientFill(trimmed)) {
    const p = parseFill(trimmed);
    if (p.kind === 'linear') {
      return `linear-gradient(${p.angleDeg}deg, ${p.stops.join(', ')})`;
    }
    return null;
  }
  return normalizeHex(trimmed);
}

function paintsEqual(a: string, b: string): boolean {
  if (isLinearGradientFill(a) || isLinearGradientFill(b)) {
    return normalizePaint(a) === normalizePaint(b);
  }
  return colorsEqual(a, b);
}

/** Newest-first, paint-string deduped (hex or linear-gradient). */
function dedupeNewestFirst(colors: string[]): string[] {
  const out: string[] = [];
  for (const raw of colors) {
    const n = normalizePaint(raw);
    if (!n) continue;
    if (out.some((c) => paintsEqual(c, n))) continue;
    out.push(n);
    if (out.length >= MAX_RECENT) break;
  }
  return out;
}

function readRaw(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const cleaned = dedupeNewestFirst(
      parsed.filter((x): x is string => typeof x === 'string'),
    );
    if (JSON.stringify(cleaned) !== JSON.stringify(parsed)) {
      writeRaw(cleaned);
    }
    return cleaned;
  } catch {
    return [];
  }
}

function writeRaw(colors: string[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(dedupeNewestFirst(colors).slice(0, MAX_RECENT)),
    );
  } catch {
    /* quota / private mode */
  }
}

export function getRecentColors(): string[] {
  return readRaw();
}

/** Push a committed solid or gradient paint to the front. */
export function pushRecentColor(paint: string): string[] {
  const n = normalizePaint(paint);
  if (!n) return readRaw();
  const next = dedupeNewestFirst([n, ...readRaw()]);
  writeRaw(next);
  return next;
}

export function sanitizeRecentColors(colors: string[]): string[] {
  return dedupeNewestFirst(colors);
}
