import type { AssetStore } from '../store/assetStore';
import {
  DOCUMENT_SCHEMA_VERSION,
  createId,
  identityTransform,
  type FrameNode,
  type GroupNode,
  type ImageNode,
  type Page,
  type SceneId,
  type ShapeKind,
  type ShapeNode,
  type StudioDocument,
  type TextNode,
} from '../model';

export function emptyDoc(name: string, sceneId: SceneId): {
  doc: StudioDocument;
  pageId: string;
  frameId: string;
} {
  const pageId = createId('page');
  const frameId = createId('frame');
  const doc: StudioDocument = {
    id: createId('doc'),
    name,
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    pages: [{ id: pageId, name: '页面 1', frameIds: [frameId] } satisfies Page],
    activePageId: pageId,
    nodes: {},
    selection: [],
    sceneId,
  };
  return { doc, pageId, frameId };
}

/** Append a page + blank frame (scene factories / dual-sided templates). */
export function addPageWithFrame(
  doc: StudioDocument,
  opts: {
    name: string;
    width: number;
    height: number;
    fill?: string;
    activate?: boolean;
  },
): { pageId: string; frameId: string } {
  const pageId = createId('page');
  const frameId = createId('frame');
  const frame = makeFrame(
    frameId,
    opts.width,
    opts.height,
    opts.name,
    opts.fill ?? '#22252c',
  );
  doc.nodes[frameId] = frame;
  doc.pages.push({
    id: pageId,
    name: opts.name,
    frameIds: [frameId],
  } satisfies Page);
  if (opts.activate !== false) {
    doc.activePageId = pageId;
  }
  return { pageId, frameId };
}

export function makeFrame(
  id: string,
  width: number,
  height: number,
  name: string,
  fill = '#22252c',
): FrameNode {
  return {
    id,
    name,
    type: 'frame',
    visible: true,
    locked: true,
    opacity: 1,
    parentId: null,
    transform: identityTransform(0, 0),
    width,
    height,
    fill,
    children: [],
  };
}

export type MakeTextOpts = {
  name?: string;
  fontFamily?: string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  bold?: boolean;
  align?: TextNode['align'];
  lineHeight?: number;
  writingMode?: TextNode['writingMode'];
};

export function makeText(
  parentId: string,
  content: string,
  x: number,
  y: number,
  fontSize: number,
  nameOrOpts?: string | MakeTextOpts,
): TextNode {
  const opts: MakeTextOpts =
    typeof nameOrOpts === 'string' || nameOrOpts === undefined
      ? { name: nameOrOpts }
      : nameOrOpts;
  // Stroke is opt-in — default none (matches contentDefaults / design tools).
  const strokeWidth = opts.strokeWidth ?? 0;
  return {
    id: createId('text'),
    name: opts.name ?? content.slice(0, 16),
    type: 'text',
    visible: true,
    locked: false,
    opacity: 1,
    parentId,
    transform: identityTransform(x, y),
    content,
    fontSize,
    fontFamily:
      opts.fontFamily ?? '"PingFang SC", "Microsoft YaHei", sans-serif',
    color: opts.color ?? '#ffffff',
    strokeColor: opts.strokeColor ?? '#000000',
    strokeWidth,
    bold: opts.bold ?? true,
    align: opts.align ?? 'center',
    writingMode: opts.writingMode ?? 'horizontal',
    ...(opts.lineHeight != null ? { lineHeight: opts.lineHeight } : {}),
  };
}

export function makeShape(
  parentId: string,
  shape: ShapeKind,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    stroke?: string;
    strokeWidth?: number;
    name?: string;
    cornerRadius?: number;
    opacity?: number;
    dash?: number[];
    locked?: boolean;
  },
): ShapeNode {
  return {
    id: createId('shape'),
    name: opts.name ?? shape,
    type: 'shape',
    visible: true,
    locked: opts.locked ?? false,
    opacity: opts.opacity ?? 1,
    parentId,
    transform: identityTransform(opts.x, opts.y),
    shape,
    width: opts.width,
    height: opts.height,
    fill: opts.fill,
    stroke: opts.stroke ?? '#000000',
    strokeWidth: opts.strokeWidth ?? 0,
    cornerRadius: opts.cornerRadius,
    ...(opts.dash?.length ? { dash: opts.dash } : {}),
  };
}

export function makeGroup(
  parentId: string,
  childIds: string[],
  opts?: { x?: number; y?: number; name?: string; locked?: boolean },
): GroupNode {
  return {
    id: createId('group'),
    name: opts?.name ?? '组',
    type: 'group',
    visible: true,
    locked: opts?.locked ?? false,
    opacity: 1,
    parentId,
    transform: identityTransform(opts?.x ?? 0, opts?.y ?? 0),
    children: childIds,
  };
}

/** Horizontal or vertical line as a zero-thickness shape (see engine drawShape line case). */
export function makeLine(
  parentId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  opts?: {
    stroke?: string;
    strokeWidth?: number;
    name?: string;
    locked?: boolean;
  },
): ShapeNode {
  return {
    id: createId('shape'),
    name: opts?.name ?? '线',
    type: 'shape',
    shape: 'line',
    visible: true,
    locked: opts?.locked ?? false,
    opacity: 1,
    parentId,
    transform: identityTransform(x, y),
    width,
    height,
    fill: 'transparent',
    stroke: opts?.stroke ?? '#cc4444',
    strokeWidth: opts?.strokeWidth ?? 1,
  };
}

export function fitImageNode(
  parentId: string,
  assets: AssetStore,
  image: ImageData,
  frameW: number,
  frameH: number,
  name = '主图',
): ImageNode {
  const asset = assets.putImageData(image);
  const scale = Math.min(frameW / image.width, frameH / image.height);
  const w = Math.round(image.width * scale);
  const h = Math.round(image.height * scale);
  return {
    id: createId('image'),
    name,
    type: 'image',
    visible: true,
    locked: false,
    opacity: 1,
    parentId,
    transform: identityTransform((frameW - w) / 2, (frameH - h) / 2),
    assetId: asset.id,
    width: w,
    height: h,
  };
}
