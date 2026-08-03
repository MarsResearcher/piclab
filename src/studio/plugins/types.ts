import type { DocStore } from '../store/docStore';
import type { AssetStore } from '../store/assetStore';
import type { DocHistory } from '../store/history';
import type { SceneId, StudioDocument } from '../model';

export type ToolContext = {
  doc: DocStore;
  assets: AssetStore;
  history: DocHistory;
  requestRender: (silent?: boolean) => void;
};

export type ToolPlugin = {
  id: string;
  label: string;
  activate: (ctx: ToolContext) => void;
  deactivate: () => void;
};

/** Optional params for parametric print scenes (grids) and image-backed scenes. */
export type SceneCreateOptions = {
  fromImage?: ImageData;
  assets?: AssetStore;
  /** Grid rows (tianzige / pinyin bands / calligraphy). */
  rows?: number;
  /** Grid columns (tianzige / calligraphy竖格). */
  cols?: number;
  /** Number of A4 pages to generate. */
  pageCount?: number;
  /** Page margin in millimeters. */
  marginMm?: number;
  /** Calligraphy grid variant. */
  gridStyle?: 'shuge' | 'mizi';
  /** Xiaohongshu: starting card type (default cover). */
  xhsCardType?: string;
  /** Xiaohongshu: theme partial (skin / palette / bg / typeScale). */
  xhsTheme?: {
    skin?: string;
    palette?: string;
    bg?: string;
    typeScale?: string;
  };
};

export type ScenePlugin = {
  id: SceneId;
  label: string;
  description: string;
  createDocument: (opts?: SceneCreateOptions) => StudioDocument;
  exportHints?: { width: number; height: number; name: string }[];
  tools?: string[];
};
