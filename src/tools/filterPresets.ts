import type { AdjustParams } from './adjust';

export type FilterPreset = {
  id: string;
  name: string;
  adjust: AdjustParams;
};

/** Curated look presets — Meitu-style one-tap grading. */
export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'none',
    name: '原图',
    adjust: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      vignette: 0,
      grain: 0,
    },
  },
  {
    id: 'fresh',
    name: '清新',
    adjust: {
      brightness: 0.08,
      contrast: 0.05,
      saturation: 0.18,
      temperature: -0.08,
      vignette: 0,
      grain: 0,
    },
  },
  {
    id: 'film',
    name: '胶片',
    adjust: {
      brightness: -0.02,
      contrast: 0.12,
      saturation: -0.1,
      temperature: 0.15,
      vignette: 0.35,
      grain: 0.28,
    },
  },
  {
    id: 'mono',
    name: '黑白',
    adjust: {
      brightness: 0.02,
      contrast: 0.2,
      saturation: -1,
      temperature: 0,
      vignette: 0.2,
      grain: 0.12,
    },
  },
  {
    id: 'warm',
    name: '暖阳',
    adjust: {
      brightness: 0.1,
      contrast: 0.08,
      saturation: 0.12,
      temperature: 0.35,
      vignette: 0.15,
      grain: 0.05,
    },
  },
  {
    id: 'cool',
    name: '冷调',
    adjust: {
      brightness: 0.02,
      contrast: 0.1,
      saturation: -0.05,
      temperature: -0.4,
      vignette: 0.25,
      grain: 0.08,
    },
  },
  {
    id: 'portrait',
    name: '人像柔光',
    adjust: {
      brightness: 0.12,
      contrast: -0.08,
      saturation: 0.06,
      temperature: 0.1,
      vignette: 0.18,
      grain: 0,
    },
  },
];
