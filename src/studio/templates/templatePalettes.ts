/**
 * Per-brief print palettes — each set is a design decision, not a global brand dump.
 * Avoid AI-default clusters (cream+terracotta, acid-on-black, broadsheet gray).
 */

export type TemplatePalette = {
  id: string;
  field: string;
  panel: string;
  ink: string;
  mute: string;
  accent: string;
};

export const CONCRETE: TemplatePalette = {
  id: 'concrete',
  field: '#ECEEF1',
  panel: '#1A1C1E',
  ink: '#1A1C1E',
  mute: '#5C6570',
  accent: '#6B7C8F',
};

export const CINNABAR: TemplatePalette = {
  id: 'cinnabar',
  field: '#F2F4F6',
  panel: '#1C2333',
  ink: '#1C2333',
  mute: '#5A6270',
  accent: '#9B1B30',
};

export const SWISS_YELLOW: TemplatePalette = {
  id: 'swiss-yellow',
  field: '#F5D400',
  panel: '#111111',
  ink: '#111111',
  mute: '#111111',
  accent: '#111111',
};

export const CHARCOAL: TemplatePalette = {
  id: 'charcoal',
  field: '#0C0C0E',
  panel: '#16161A',
  ink: '#F2EFE8',
  mute: '#9A968C',
  accent: '#E11D48',
};

export const SAGE: TemplatePalette = {
  id: 'sage',
  field: '#E5EBE3',
  panel: '#CFD8CB',
  ink: '#2C3329',
  mute: '#5C6658',
  accent: '#6F8F6A',
};

export const COBALT: TemplatePalette = {
  id: 'cobalt',
  field: '#0B1F4A',
  panel: '#122B5C',
  ink: '#FFFFFF',
  mute: '#A8C4F0',
  accent: '#7EB6FF',
};

/** Gallery white + ultramarine. */
export const GALLERY: TemplatePalette = {
  id: 'gallery',
  field: '#F7F7F5',
  panel: '#FFFFFF',
  ink: '#111318',
  mute: '#6B7080',
  accent: '#1E3A8A',
};

/** Cinema burgundy + bone type. */
export const CINEMA: TemplatePalette = {
  id: 'cinema',
  field: '#2A0F18',
  panel: '#3D1522',
  ink: '#F3EDE4',
  mute: '#C4A8B0',
  accent: '#E8C547',
};

/** Market tomato — food / bazaar. */
export const TOMATO: TemplatePalette = {
  id: 'tomato',
  field: '#E23D28',
  panel: '#C43220',
  ink: '#FFFFFF',
  mute: '#FFD5CF',
  accent: '#FFFFFF',
};

/** Slate + signal orange — sports (orange is content, not acid green). */
export const TRACK: TemplatePalette = {
  id: 'track',
  field: '#1E242B',
  panel: '#2A323C',
  ink: '#F5F7FA',
  mute: '#9AA6B2',
  accent: '#FF6A00',
};

/** Chalk classroom — workshop. */
export const CHALK: TemplatePalette = {
  id: 'chalk',
  field: '#2F4A5C',
  panel: '#3A5A70',
  ink: '#F4F7FA',
  mute: '#B8C9D4',
  accent: '#F2C14E',
};

/** Split festival — magenta field / ink black (not purple-on-white UI cliché). */
export const FESTIVAL: TemplatePalette = {
  id: 'festival',
  field: '#FF2D55',
  panel: '#111111',
  ink: '#111111',
  mute: '#111111',
  accent: '#FFFFFF',
};

/** Mist sky — open house / space. */
export const MIST: TemplatePalette = {
  id: 'mist',
  field: '#D8E4EE',
  panel: '#C0D2E0',
  ink: '#14202B',
  mute: '#4A5C6A',
  accent: '#14202B',
};

/** Ivory stage — theater playbill. */
export const STAGE: TemplatePalette = {
  id: 'stage',
  field: '#0F1012',
  panel: '#1A1B1F',
  ink: '#F7F0E4',
  mute: '#A89F90',
  accent: '#D4A017',
};

/** Paper quote — social. */
export const QUOTE: TemplatePalette = {
  id: 'quote',
  field: '#FAFAF7',
  panel: '#EFEFEA',
  ink: '#1A1A1A',
  mute: '#6A6A64',
  accent: '#1A1A1A',
};

/** Hot price — ad takeover. */
export const PRICE: TemplatePalette = {
  id: 'price',
  field: '#0E0E10',
  panel: '#1A1A1E',
  ink: '#FFFFFF',
  mute: '#A0A0A8',
  accent: '#FF3D00',
};

/**
 * Template font stacks — bundled OFL faces first (see fonts/catalog.ts),
 * system faces only as fallbacks so offline thumbs match the editor.
 */

/** Body / UI Chinese — never for poetry or hero titles. */
export const FONT_SANS =
  '"Outfit", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
/** Monumental CJK display (得意黑). */
export const FONT_HEI =
  '"Smiley Sans Oblique", "ZCOOL QingKe HuangYou", "Microsoft YaHei", "PingFang SC", sans-serif';
/** Editorial Chinese — verse, gallery (霞鹜文楷作宋感正文). */
export const FONT_SONG =
  '"LXGW WenKai", "ZCOOL XiaoWei", "Songti SC", "Noto Serif SC", serif';
/** Brush / emotional Chinese — overlays, seals. */
export const FONT_KAI =
  '"Ma Shan Zheng", "LXGW WenKai", "KaiTi", "STKaiti", serif';
/** Refined Chinese captions (展讯 / 说明) — 小薇典雅. */
export const FONT_FANG =
  '"ZCOOL XiaoWei", "FangSong", "STFangsong", "Songti SC", serif';
/** Condensed Latin display (Bebas / Anton). */
export const FONT_LATIN_DISPLAY =
  '"Bebas Neue", "Anton", "Archivo Black", Impact, "Arial Black", sans-serif';
/** Latin editorial / quotes. */
export const FONT_LATIN_SERIF =
  '"Playfair Display", "DM Serif Display", Georgia, Palatino, serif';
/** Geometric Latin. */
export const FONT_LATIN_GEO =
  '"Space Grotesk", "Montserrat", "Century Gothic", Arial, sans-serif';
/** Clean Latin UI / event titles. */
export const FONT_LATIN_SANS =
  '"Outfit", "Montserrat", Helvetica, "PingFang SC", sans-serif';
/** Engraved / copperplate captions. */
export const FONT_LATIN_ENGRAVED =
  '"Cormorant Garamond", Copperplate, "PingFang SC", serif';
/** CJK display round (站酷快乐 / 黄油). */
export const FONT_YUAN =
  '"ZCOOL KuaiLe", "ZCOOL QingKe HuangYou", "YouYuan", "PingFang SC", sans-serif';
/** Journal messy hand (刘建毛草) — scrapbook titles. */
export const FONT_HAND =
  '"Liu Jian Mao Cao", "Zhi Mang Xing", "ZCOOL KuaiLe", "KaiTi", cursive';
/** Latin marker / wishlist accents (Caveat). */
export const FONT_MARKER =
  '"Caveat", "Patrick Hand", "Segoe Print", "ZCOOL KuaiLe", cursive';
/** Xingkai / running script. */
export const FONT_XING =
  '"Zhi Mang Xing", "Long Cang", "STXingkai", "KaiTi", serif';
/** Clerical / 隶书 — 龙藏体作笔墨感. */
export const FONT_LI =
  '"Long Cang", "Ma Shan Zheng", "STLiti", "KaiTi", serif';
/** Issue numbers, codes. */
export const FONT_MONO =
  '"Space Grotesk", "Courier New", Consolas, monospace';
/** Tiny metadata (VOL / dates). */
export const FONT_META =
  '"Outfit", system-ui, -apple-system, "Segoe UI", sans-serif';

/** @deprecated L2 scene adapters */
export const GRAPHITE = {
  id: 'graphite',
  bg: CHARCOAL.field,
  bgAlt: CHARCOAL.panel,
  ink: CHARCOAL.ink,
  muted: CHARCOAL.mute,
  accent: CHARCOAL.accent,
  surface: CHARCOAL.panel,
};
export const WARM_PAPER = {
  id: 'warm-paper',
  bg: SAGE.field,
  bgAlt: SAGE.panel,
  ink: SAGE.ink,
  muted: SAGE.mute,
  accent: SAGE.accent,
  surface: SAGE.panel,
};
export const NIGHT_SEA = {
  id: 'night-sea',
  bg: COBALT.field,
  bgAlt: COBALT.panel,
  ink: COBALT.ink,
  muted: COBALT.mute,
  accent: COBALT.accent,
  surface: COBALT.panel,
};
export const INK = {
  id: 'ink',
  bg: CINNABAR.field,
  bgAlt: '#E6E9ED',
  ink: CINNABAR.ink,
  muted: CINNABAR.mute,
  accent: CINNABAR.accent,
  surface: CINNABAR.panel,
};
