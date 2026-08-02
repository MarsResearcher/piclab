/**
 * Curated gradient chips — UI shows the ramp; click commits a solid hex.
 */

export type GradientPreset = {
  id: string;
  name: string;
  stops: [string, string] | [string, string, string];
};

/** Pick solid from ramp: middle stop, or last of two. */
export function solidFromGradient(g: GradientPreset): string {
  const stops = g.stops;
  if (stops.length >= 3) return stops[1]!;
  return stops[stops.length - 1]!;
}

export function gradientCss(g: GradientPreset): string {
  return `linear-gradient(135deg, ${g.stops.join(', ')})`;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'ink', name: '墨阶', stops: ['#0C0B0A', '#5A544C', '#E8E2D6'] },
  { id: 'paper', name: '宣纸', stops: ['#FFFCF7', '#E2C4A0'] },
  { id: 'copper', name: '暖铜', stops: ['#3A2218', '#C4784A', '#E2C4A0'] },
  { id: 'gold', name: '缃金', stops: ['#3A2A10', '#C9A227', '#F5E6A8'] },
  { id: 'cinnabar', name: '朱红', stops: ['#4A1210', '#B8322B', '#F0A090'] },
  { id: 'indigo', name: '群青', stops: ['#0A1A2E', '#1F4B8C', '#8FA3B8'] },
  { id: 'pine', name: '松花', stops: ['#0E2418', '#2F6F4E', '#A8D4B8'] },
  { id: 'teal', name: '青碧', stops: ['#0A2A28', '#2A9D8F', '#B8E8E0'] },
  { id: 'night', name: '午夜', stops: ['#05080E', '#1A2F45', '#8FA3B8'] },
  { id: 'sunset', name: '晚烧', stops: ['#2A1020', '#C4784A', '#FFE14D'] },
  { id: 'lilac', name: '胭脂雾', stops: ['#2A1028', '#6B2D5C', '#E8B8D8'] },
  { id: 'sea', name: '远海', stops: ['#061820', '#1A5F7A', '#7EC8E3'] },
  { id: 'forest', name: '林荫', stops: ['#0C1A10', '#2D5A3D', '#8FBC6B'] },
  { id: 'mono', name: '银灰', stops: ['#121212', '#6B6B6B', '#F0F0F0'] },
  { id: 'lemon', name: '柠金', stops: ['#2A2808', '#C9A227', '#FFE14D'] },
  { id: 'berry', name: '浆果', stops: ['#1A0814', '#8B2252', '#F0A0C0'] },
];
