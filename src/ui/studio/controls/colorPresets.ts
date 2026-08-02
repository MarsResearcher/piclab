/**
 * Curated print / editorial palettes.
 * Each set is a designed combination (not a random ramp + leftover accents).
 * Layout assumes a 6-column chip grid — prefer 6 swatches (one clean row).
 */

export type ColorSwatch = {
  hex: string;
  label: string;
};

export type ColorPalette = {
  id: string;
  name: string;
  /** Short mood line for UI title tooltip / future use. */
  mood?: string;
  swatches: ColorSwatch[];
};

/**
 * Primary quick palette — pure paper/ink neutrals.
 * Order: light field → mid mute → deep ink (reading left → right).
 * No UI chrome teals here (those are product chrome, not content ink).
 */
export const GRAPHITE_PALETTE: ColorPalette = {
  id: 'graphite',
  name: '纸墨',
  mood: '印刷基调',
  swatches: [
    { hex: '#FFFCF7', label: '宣纸' },
    { hex: '#E8E2D6', label: '素练' },
    { hex: '#A8A093', label: '茶灰' },
    { hex: '#5A544C', label: '铅灰' },
    { hex: '#24211E', label: '松烟' },
    { hex: '#0C0B0A', label: '浓墨' },
  ],
};

/** Punch accents that pair with 纸墨 — one deliberate chromatic set. */
export const PRINT_ACCENT_PALETTE: ColorPalette = {
  id: 'print-accent',
  name: '印刷强调',
  mood: '点缀 / 印章 / CTA',
  swatches: [
    { hex: '#B8322B', label: '朱红' },
    { hex: '#1F4B8C', label: '群青' },
    { hex: '#2F6F4E', label: '松花' },
    { hex: '#C9A227', label: '缃金' },
    { hex: '#6B2D5C', label: '胭脂' },
    { hex: '#2A9D8F', label: '青碧' },
  ],
};

/** Warm copper editorial — refined, not muddy brown dump. */
export const WARM_PAPER_PALETTE: ColorPalette = {
  id: 'warm-paper',
  name: '暖铜',
  mood: '纸本 · 铜印',
  swatches: [
    { hex: '#FBF6EF', label: '骨纸' },
    { hex: '#E2C4A0', label: '浅铜' },
    { hex: '#C4784A', label: '赤铜' },
    { hex: '#8E3B2C', label: '赭口' },
    { hex: '#3A2218', label: '栗墨' },
    { hex: '#D4AF37', label: '箔金' },
  ],
};

/** Cool slate + gold — night editorial. */
export const NIGHT_SEA_PALETTE: ColorPalette = {
  id: 'night-sea',
  name: '青金',
  mood: '夜读 · 箔烫',
  swatches: [
    { hex: '#F1F4F7', label: '霜白' },
    { hex: '#8FA3B8', label: '雾青' },
    { hex: '#3D5A74', label: '钢青' },
    { hex: '#1A2F45', label: '深港' },
    { hex: '#0A121C', label: '午夜' },
    { hex: '#C9A227', label: '箔金' },
  ],
};

/** Cinnabar / ink studio — East Asian print energy. */
export const INK_COLOR_PALETTE: ColorPalette = {
  id: 'ink-color',
  name: '朱墨',
  mood: '印社 · 书画',
  swatches: [
    { hex: '#F6F0E6', label: '牙白' },
    { hex: '#1A1917', label: '松烟' },
    { hex: '#9B1B1B', label: '朱砂' },
    { hex: '#1A3A5C', label: '靛青' },
    { hex: '#C4A35A', label: '缃黄' },
    { hex: '#3E5C4A', label: '黛绿' },
  ],
};

/** Soft forest field — calm poster / nature. */
export const FOREST_PALETTE: ColorPalette = {
  id: 'forest',
  name: '森雾',
  mood: '旷野 · 植物',
  swatches: [
    { hex: '#F3F5F0', label: '雾纸' },
    { hex: '#B5C4B0', label: '苔灰' },
    { hex: '#5E7A62', label: '松青' },
    { hex: '#2C3D30', label: '林荫' },
    { hex: '#141C16', label: '夜森' },
    { hex: '#C47A3A', label: '琥珀' },
  ],
};

/** High-contrast Swiss-ish block — poster punch. */
export const SWISS_PALETTE: ColorPalette = {
  id: 'swiss',
  name: '海报块面',
  mood: '强对比排版',
  swatches: [
    { hex: '#F5F5F0', label: '冷纸' },
    { hex: '#111111', label: '墨块' },
    { hex: '#E2B714', label: '信号黄' },
    { hex: '#E11D48', label: '信号红' },
    { hex: '#2563EB', label: '信号蓝' },
    { hex: '#F4F0E8', label: '暖白' },
  ],
};

/** All named palettes (primary first). */
export const COLOR_PALETTES: ColorPalette[] = [
  GRAPHITE_PALETTE,
  PRINT_ACCENT_PALETTE,
  WARM_PAPER_PALETTE,
  NIGHT_SEA_PALETTE,
  INK_COLOR_PALETTE,
  FOREST_PALETTE,
  SWISS_PALETTE,
];

/** @deprecated Use GRAPHITE_PALETTE.swatches — kept for import compatibility. */
export const ATELIER_SWATCHES: ColorSwatch[] = GRAPHITE_PALETTE.swatches;

/** Flat list of every curated swatch (deduped by hex). */
export const PRESET_SWATCHES: ColorSwatch[] = (() => {
  const seen = new Set<string>();
  const out: ColorSwatch[] = [];
  for (const pal of COLOR_PALETTES) {
    for (const s of pal.swatches) {
      const key = s.hex.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
  }
  return out;
})();

export function normalizeHex(input: string): string | null {
  let s = input.trim();
  if (!s) return null;
  // rgb(r,g,b) / rgba(r,g,b,a) → hex (ignore alpha for recent/swatch identity)
  const rgb = /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i.exec(s);
  if (rgb) {
    const r = Math.round(Number(rgb[1]));
    const g = Math.round(Number(rgb[2]));
    const b = Math.round(Number(rgb[3]));
    if ([r, g, b].every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) {
      const h = (n: number) => n.toString(16).padStart(2, '0');
      return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
    }
    return null;
  }
  if (!s.startsWith('#')) s = `#${s}`;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1]!;
    const g = s[2]!;
    const b = s[3]!;
    s = `#${r}${r}${g}${g}${b}${b}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(s)) return null;
  return s.toUpperCase();
}

export function colorsEqual(a: string, b: string): boolean {
  const na = normalizeHex(a);
  const nb = normalizeHex(b);
  if (!na || !nb) return a.trim().toLowerCase() === b.trim().toLowerCase();
  return na === nb;
}
