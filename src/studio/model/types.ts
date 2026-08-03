/** Figma-like document model for PicLab Studio. */

export type Transform2D = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
};

export type NodeBase = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  transform: Transform2D;
  parentId: string | null;
};

export type FrameNode = NodeBase & {
  type: 'frame';
  width: number;
  height: number;
  fill?: string;
  children: string[];
};

/** Non-destructive clip for ImageNode (offline; not AI cutout). */
export type ImageMask = 'none' | 'ellipse' | 'roundRect';

export type ImageNode = NodeBase & {
  type: 'image';
  assetId: string;
  width: number;
  height: number;
  /** Clip shape; omit / 'none' = rectangular. */
  mask?: ImageMask;
  /** Corner radius for roundRect mask (px). */
  maskRadius?: number;
};

/** Horizontal LTR lines, or upright vertical columns (CJK tate). */
export type TextWritingMode = 'horizontal' | 'vertical';

export type TextNode = NodeBase & {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  bold: boolean;
  align: 'left' | 'center' | 'right';
  /** Line height multiplier (default ~1.25). Vertical: advance along the column. */
  lineHeight?: number;
  /**
   * `horizontal` (default): lines left→right, stack top→bottom.
   * `vertical`: upright glyphs top→bottom; `\n` starts a new column right→left.
   */
  writingMode?: TextWritingMode;
};

export type GroupNode = NodeBase & {
  type: 'group';
  children: string[];
};

export type ShapeKind =
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'roundRect'
  | 'triangle'
  | 'star'
  | 'arrow';

export type ShapeNode = NodeBase & {
  type: 'shape';
  shape: ShapeKind;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  /** Corner radius for roundRect (px). */
  cornerRadius?: number;
  /** Dashed stroke pattern (e.g. [8, 6]). */
  dash?: number[];
};

export type InkBrush = 'pen' | 'marker' | 'highlighter';

/** Freehand stroke (vector polyline); bake to ImageNode for materials. */
export type InkNode = NodeBase & {
  type: 'ink';
  points: { x: number; y: number }[];
  stroke: string;
  strokeWidth: number;
  brush: InkBrush;
};

export type SceneNode = FrameNode | ImageNode | TextNode | GroupNode | ShapeNode | InkNode;

export type Page = {
  id: string;
  name: string;
  frameIds: string[];
};

export type SceneId =
  | 'retouch'
  | 'card'
  | 'poster'
  | 'ad'
  | 'social'
  | 'wechatCover'
  | 'xhsNote'
  | 'tianzige'
  | 'pinyin'
  | 'calligraphy';

export type StudioDocument = {
  id: string;
  name: string;
  /**
   * On-disk schema revision. Always written by factories / migrateDocument.
   * Optional only for legacy IDB rows loaded before versioning existed.
   * @see migrate.ts DOCUMENT_SCHEMA_VERSION
   */
  schemaVersion?: number;
  pages: Page[];
  activePageId: string;
  nodes: Record<string, SceneNode>;
  selection: string[];
  sceneId?: SceneId;
};

export function identityTransform(x = 0, y = 0): Transform2D {
  return { x, y, scaleX: 1, scaleY: 1, rotation: 0 };
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function isFrame(n: SceneNode): n is FrameNode {
  return n.type === 'frame';
}

export function isText(n: SceneNode): n is TextNode {
  return n.type === 'text';
}

export function isImage(n: SceneNode): n is ImageNode {
  return n.type === 'image';
}

export function isShape(n: SceneNode): n is ShapeNode {
  return n.type === 'shape';
}

export function isGroup(n: SceneNode): n is GroupNode {
  return n.type === 'group';
}

export function isInk(n: SceneNode): n is InkNode {
  return n.type === 'ink';
}

/** Active page (one artboard / side). */
export function getActivePage(doc: StudioDocument): Page | null {
  return doc.pages.find((p) => p.id === doc.activePageId) ?? null;
}

/**
 * Active frame for the current page.
 * Convention: one page = one frame (`frameIds[0]`).
 */
export function getActiveFrame(doc: StudioDocument): FrameNode | null {
  const page = getActivePage(doc);
  if (!page || page.frameIds.length === 0) return null;
  const frame = doc.nodes[page.frameIds[0]!];
  return frame && isFrame(frame) ? frame : null;
}

export function getFrameById(doc: StudioDocument, frameId: string): FrameNode | null {
  const frame = doc.nodes[frameId];
  return frame && isFrame(frame) ? frame : null;
}

/** Primary frame id for a page (one-page-one-frame). */
export function getPageFrameId(page: Page): string | null {
  return page.frameIds[0] ?? null;
}

export function cloneDocument(doc: StudioDocument): StudioDocument {
  return structuredClone(doc);
}
