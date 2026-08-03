import { colorsEqual, normalizeHex } from './colorPresets';

const STORAGE_KEY = 'piclab-recent-colors';
const MAX_RECENT = 12;

/** Newest-first, exact-hex deduped. Heals corrupted / pre-dedupe localStorage. */
function dedupeNewestFirst(colors: string[]): string[] {
  const out: string[] = [];
  for (const raw of colors) {
    const n = normalizeHex(raw);
    if (!n) continue;
    if (out.some((c) => colorsEqual(c, n))) continue;
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
    // Self-heal: rewrite if duplicates / junk were stored.
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

/** Newest-first recent colors (hex uppercase, deduped). */
export function getRecentColors(): string[] {
  return readRaw();
}

/** Push a committed color to the front; never stores duplicates. */
export function pushRecentColor(hex: string): string[] {
  const n = normalizeHex(hex);
  if (!n) return readRaw();
  const next = dedupeNewestFirst([n, ...readRaw()]);
  writeRaw(next);
  return next;
}

/** One-shot cleanup for callers that hold a stale list in React state. */
export function sanitizeRecentColors(colors: string[]): string[] {
  return dedupeNewestFirst(colors);
}
