/**
 * Composable type roles — pick face by scene, never one sans for everything.
 *
 * Contrast rules (templates must follow):
 * - Primary type on photo → light on dark veil, OR dark on light sky with stroke
 * - Accent color only where contrast ≥ mid; never lemon on pale green grass
 * - Mute gray is for tertiary only; never for titles
 */

import { makeText, type MakeTextOpts } from '../scenes/helpers';
import type { TextNode } from '../model';
import {
  FONT_FANG,
  FONT_HEI,
  FONT_KAI,
  FONT_LATIN_DISPLAY,
  FONT_LATIN_SERIF,
  FONT_META,
  FONT_SANS,
  FONT_SONG,
} from './templatePalettes';

export type TypeRole =
  | 'display'
  | 'script'
  | 'serifQuote'
  | 'fang'
  | 'body'
  | 'meta'
  | 'caption'
  | 'latinDisplay'
  | 'latinSerif';

export type TypeRamp = {
  display: number;
  script: number;
  serifQuote: number;
  fang: number;
  body: number;
  meta: number;
  caption: number;
  latinDisplay: number;
  latinSerif: number;
};

/** Poster / social (tall ~1080×1920) — floors kept readable at thumb. */
export const RAMP_POSTER: TypeRamp = {
  display: 96,
  script: 88,
  serifQuote: 48,
  fang: 28,
  body: 32,
  meta: 26,
  caption: 20,
  latinDisplay: 120,
  latinSerif: 24,
};

/** Landscape card 1050×600. */
export const RAMP_CARD: TypeRamp = {
  display: 48,
  script: 44,
  serifQuote: 28,
  fang: 18,
  body: 18,
  meta: 15,
  caption: 14,
  latinDisplay: 36,
  latinSerif: 14,
};

/** Square ad / social 1080×1080. */
export const RAMP_SQUARE: TypeRamp = {
  display: 88,
  script: 72,
  serifQuote: 48,
  fang: 26,
  body: 28,
  meta: 20,
  caption: 18,
  latinDisplay: 96,
  latinSerif: 22,
};

/** WeChat OA headline banner (~1800×766 design). */
export const RAMP_WECHAT: TypeRamp = {
  display: 64,
  script: 56,
  serifQuote: 36,
  fang: 24,
  body: 26,
  meta: 20,
  caption: 18,
  latinDisplay: 72,
  latinSerif: 22,
};

/** Xiaohongshu 3:4 text cards / covers (1080×1440). */
export const RAMP_XHS: TypeRamp = {
  display: 72,
  script: 56,
  serifQuote: 44,
  fang: 28,
  body: 36,
  meta: 22,
  caption: 20,
  latinDisplay: 96,
  latinSerif: 24,
};

const ROLE_FONT: Record<TypeRole, string> = {
  display: FONT_HEI,
  script: FONT_KAI,
  serifQuote: FONT_SONG,
  fang: FONT_FANG,
  body: FONT_SANS,
  meta: FONT_META,
  caption: FONT_SANS,
  latinDisplay: FONT_LATIN_DISPLAY,
  latinSerif: FONT_LATIN_SERIF,
};

const ROLE_BOLD: Record<TypeRole, boolean> = {
  display: true,
  script: false,
  serifQuote: false,
  fang: false,
  body: false,
  meta: false,
  caption: false,
  latinDisplay: true,
  latinSerif: false,
};

export function makeRoleText(
  parentId: string,
  role: TypeRole,
  content: string,
  x: number,
  y: number,
  ramp: TypeRamp,
  opts?: MakeTextOpts & { fontSize?: number },
): TextNode {
  const fontSize = opts?.fontSize ?? ramp[role];
  return makeText(parentId, content, x, y, fontSize, {
    name: opts?.name ?? role,
    fontFamily: opts?.fontFamily ?? ROLE_FONT[role],
    color: opts?.color ?? '#111111',
    strokeWidth: opts?.strokeWidth ?? 0,
    bold: opts?.bold ?? ROLE_BOLD[role],
    align: opts?.align ?? 'left',
    lineHeight: opts?.lineHeight,
    strokeColor: opts?.strokeColor,
    writingMode: opts?.writingMode,
  });
}

export function stackOffset(
  anchor: TextNode,
  dx: number,
  dy: number,
): { x: number; y: number } {
  return {
    x: anchor.transform.x + dx,
    y: anchor.transform.y + dy,
  };
}

/** Soft halo so dark type reads on busy photo (keep stroke thin). */
export function withHalo(
  node: TextNode,
  strokeColor = 'rgba(255,255,255,0.55)',
  strokeWidth = 3,
): TextNode {
  return { ...node, strokeColor, strokeWidth };
}