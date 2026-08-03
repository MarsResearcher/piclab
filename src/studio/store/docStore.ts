import {
  cloneDocument,
  createId,
  getActiveFrame,
  getActivePage,
  identityTransform,
  isFrame,
  isGroup,
  isImage,
  isInk,
  migrateDocument,
  validateDocument,
  type FrameNode,
  type GroupNode,
  type ImageNode,
  type InkBrush,
  type InkNode,
  type Page,
  type SceneNode,
  type ShapeNode,
  type StudioDocument,
  type TextNode,
  type Transform2D,
} from '../model';
import { contentDefaults } from '../contentDefaults';
import { alignNodesToFrame, type AlignEdge } from '../engine/align';
import { bakeInkNodes } from '../engine/bakeInk';
import { flipNodeTransform } from '../engine/selection';
import type { AssetStore } from './assetStore';
import { applyCrop, type CropRect } from '../../tools/crop';
import {
  coalesceKeyForNodePatch,
  type DocCommand,
} from './commands';
import { DocHistory } from './history';

type Listener = () => void;

type MutateOpts = {
  recordHistory?: boolean;
  coalesceKey?: string;
};

export class DocStore {
  private doc: StudioDocument | null = null;
  private listeners = new Set<Listener>();
  private gesturing = false;
  private transactionOpen = false;
  private transactionKey: string | undefined;
  readonly history = new DocHistory();

  constructor(readonly assets: AssetStore) {}

  isGesturing(): boolean {
    return this.gesturing || this.transactionOpen;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  getDocument(): StudioDocument | null {
    return this.doc;
  }

  /** Replace document without history (load / scene switch). */
  load(doc: StudioDocument): void {
    const migrated = migrateDocument(doc);
    const check = validateDocument(migrated);
    if (!check.ok && typeof console !== 'undefined') {
      console.warn('[DocStore] document validation errors', check.errors);
    }
    this.doc = migrated;
    this.history.clear();
    this.gesturing = false;
    this.transactionOpen = false;
    this.notify();
  }

  /**
   * Begin a coalesced edit session (slider scrub, etc.).
   * First mutation inside records one undo checkpoint.
   */
  beginTransaction(coalesceKey?: string): void {
    if (this.transactionOpen || this.gesturing) return;
    this.transactionOpen = true;
    this.transactionKey = coalesceKey;
    if (this.doc) this.history.push(this.doc, { coalesceKey });
  }

  commitTransaction(): void {
    if (!this.transactionOpen) return;
    this.transactionOpen = false;
    this.transactionKey = undefined;
    this.notify();
  }

  /** Apply a typed command — preferred UI entry. */
  apply(command: DocCommand): void {
    switch (command.type) {
      case 'setSelection':
        this.setSelection(command.ids);
        return;
      case 'patchNode':
        this.updateNode(command.id, command.patch, {
          coalesceKey: command.coalesceKey ?? coalesceKeyForNodePatch(command.id, command.patch),
        });
        return;
      case 'patchTransform':
        this.patchTransform(command.id, command.transform, command.coalesceKey);
        return;
      case 'deleteNodes':
        this.deleteNodes(command.ids);
        return;
      case 'setVisibility':
        this.setVisibility(command.id, command.visible);
        return;
      case 'setLocked':
        this.setLocked(command.id, command.locked);
        return;
      case 'rename':
        this.rename(command.id, command.name);
        return;
      case 'reorder':
        this.reorder(command.id, command.delta);
        return;
      case 'reorderDisplay':
        this.reorderToDisplayOrder(command.ids);
        return;
      case 'setActivePage':
        this.setActivePage(command.pageId);
        return;
      case 'addPage':
        this.addPage({
          name: command.name,
          width: command.width,
          height: command.height,
          fill: command.fill,
        });
        return;
      case 'renamePage':
        this.renamePage(command.pageId, command.name);
        return;
      case 'duplicateNodes':
        this.duplicateNodes(command.ids);
        return;
      case 'groupNodes':
        this.groupNodes(command.ids);
        return;
      case 'ungroup':
        this.ungroup(command.groupId);
        return;
      case 'flipNodes':
        this.flipNodes(command.ids, command.axis);
        return;
      case 'layerOrder':
        this.layerOrder(command.ids, command.action);
        return;
      case 'alignToFrame':
        this.alignToFrame(command.ids, command.edge);
        return;
      default: {
        const _e: never = command;
        void _e;
      }
    }
  }

  private commit(next: StudioDocument, opts: MutateOpts): void {
    if (!this.doc) return;
    const record = opts.recordHistory !== false;
    if (record && !this.gesturing && !this.transactionOpen) {
      this.history.push(this.doc, { coalesceKey: opts.coalesceKey });
    } else if (record && this.transactionOpen && opts.coalesceKey) {
      // Already checkpointed at beginTransaction; keep coalescing window warm
      this.history.push(this.doc, {
        coalesceKey: opts.coalesceKey ?? this.transactionKey,
      });
    }
    this.doc = next;
    this.notify();
  }

  private withDoc(mutator: (draft: StudioDocument) => void, opts: MutateOpts = {}): void {
    if (!this.doc) return;
    const draft = cloneDocument(this.doc);
    mutator(draft);
    this.commit(draft, opts);
  }

  setSelection(ids: string[], recordHistory = false): void {
    this.withDoc((d) => {
      d.selection = ids;
    }, { recordHistory });
  }

  updateNode(
    id: string,
    patch: Partial<SceneNode>,
    opts: boolean | MutateOpts = true,
  ): void {
    const normalized: MutateOpts =
      typeof opts === 'boolean' ? { recordHistory: opts } : opts;
    this.withDoc((d) => {
      const node = d.nodes[id];
      if (!node) return;
      d.nodes[id] = { ...node, ...patch, id: node.id, type: node.type } as SceneNode;
    }, {
      recordHistory: normalized.recordHistory,
      coalesceKey:
        normalized.coalesceKey ??
        (normalized.recordHistory === false
          ? undefined
          : coalesceKeyForNodePatch(id, patch)),
    });
  }

  patchTransform(
    id: string,
    transform: Partial<Transform2D>,
    coalesceKey?: string,
  ): void {
    this.withDoc((d) => {
      const node = d.nodes[id];
      if (!node) return;
      d.nodes[id] = {
        ...node,
        transform: { ...node.transform, ...transform },
      };
    }, { coalesceKey: coalesceKey ?? `transform:${id}` });
  }

  /** Live drag — no history until endGesture commits. */
  patchTransformSilent(
    id: string,
    transform: Partial<TextNode['transform']>,
  ): void {
    if (!this.doc) return;
    const node = this.doc.nodes[id];
    if (!node) return;
    this.doc = {
      ...this.doc,
      nodes: {
        ...this.doc.nodes,
        [id]: {
          ...node,
          transform: { ...node.transform, ...transform },
        },
      },
    };
    this.notify();
  }

  /** Live property edit during a gesture (no history). */
  patchNodeSilent(id: string, patch: Partial<SceneNode>): void {
    if (!this.doc) return;
    const node = this.doc.nodes[id];
    if (!node) return;
    this.doc = {
      ...this.doc,
      nodes: {
        ...this.doc.nodes,
        [id]: { ...node, ...patch, id: node.id, type: node.type } as SceneNode,
      },
    };
    this.notify();
  }

  beginGesture(): void {
    if (this.gesturing) return;
    this.gesturing = true;
    if (this.doc) this.history.checkpoint(this.doc);
  }

  endGesture(): void {
    if (!this.gesturing) return;
    this.gesturing = false;
    this.notify();
  }

  beginInkStroke(
    frameX: number,
    frameY: number,
    opts?: { stroke?: string; strokeWidth?: number; brush?: InkBrush },
  ): InkNode | null {
    const frame = this.doc ? getActiveFrame(this.doc) : null;
    if (!this.doc || !frame) return null;
    let inkCount = 0;
    for (const n of Object.values(this.doc.nodes)) {
      if (isInk(n)) inkCount += 1;
    }
    const ink: InkNode = {
      id: createId('ink'),
      name: `\u7b14\u753b ${inkCount + 1}`,
      type: 'ink',
      visible: true,
      locked: false,
      opacity: 1,
      parentId: frame.id,
      transform: identityTransform(frameX, frameY),
      points: [{ x: 0, y: 0 }],
      stroke: opts?.stroke ?? contentDefaults.inkStroke,
      strokeWidth: opts?.strokeWidth ?? contentDefaults.inkStrokeWidth,
      brush: opts?.brush ?? 'pen',
    };
    this.beginGesture();
    this.withDoc(
      (d) => {
        const f = d.nodes[frame.id];
        if (!f || !isFrame(f)) return;
        d.nodes[ink.id] = ink;
        d.nodes[frame.id] = { ...f, children: [...f.children, ink.id] };
        // Keep selection empty while inking so selection chrome does not chase the stroke.
        d.selection = [];
      },
      { recordHistory: false },
    );
    return ink;
  }

  appendInkPoint(id: string, frameX: number, frameY: number, minDist = 2): void {
    if (!this.doc) return;
    const node = this.doc.nodes[id];
    if (!node || !isInk(node)) return;
    const lx = frameX - node.transform.x;
    const ly = frameY - node.transform.y;
    const last = node.points[node.points.length - 1];
    if (last && Math.hypot(lx - last.x, ly - last.y) < minDist) return;
    this.patchNodeSilent(id, {
      points: [...node.points, { x: lx, y: ly }],
    } as Partial<SceneNode>);
  }

  /**
   * Bake selected ink (or all page ink if ids empty filter) into an ImageNode.
   * Removes source ink nodes after success.
   */
  bakeInkToImage(ids?: string[]): ImageNode | null {
    if (!this.doc) return null;
    const frame = getActiveFrame(this.doc);
    if (!frame) return null;
    const targetIds =
      ids?.filter((id) => {
        const n = this.doc!.nodes[id];
        return n && isInk(n);
      }) ??
      frame.children.filter((id) => {
        const n = this.doc!.nodes[id];
        return n && isInk(n);
      });
    if (!targetIds.length) return null;

    const baked = bakeInkNodes(this.doc, this.assets, targetIds);
    if (!baked) return null;
    const asset = this.assets.putImageData(baked.imageData);
    const image: ImageNode = {
      id: createId('image'),
      name: '\u7b14\u753b\u7d20\u6750',
      type: 'image',
      visible: true,
      locked: false,
      opacity: 1,
      parentId: frame.id,
      transform: identityTransform(baked.x, baked.y),
      assetId: asset.id,
      width: baked.width,
      height: baked.height,
      mask: 'none',
    };

    this.withDoc((d) => {
      const f = d.nodes[frame.id];
      if (!f || !isFrame(f)) return;
      for (const id of targetIds) {
        delete d.nodes[id];
      }
      const children = f.children.filter((cid) => !targetIds.includes(cid));
      d.nodes[image.id] = image;
      d.nodes[frame.id] = { ...f, children: [...children, image.id] };
      d.selection = [image.id];
    });
    return image;
  }

  addTextAt(
    frameX: number,
    frameY: number,
    content = '双击编辑',
    style?: Partial<
      Pick<
        TextNode,
        | 'fontSize'
        | 'fontFamily'
        | 'color'
        | 'bold'
        | 'align'
        | 'strokeColor'
        | 'strokeWidth'
        | 'writingMode'
      >
    >,
  ): TextNode | null {
    const frame = this.doc ? getActiveFrame(this.doc) : null;
    if (!this.doc || !frame) return null;

    const text: TextNode = {
      id: createId('text'),
      name: content.slice(0, 12) || '文字',
      type: 'text',
      visible: true,
      locked: false,
      opacity: 1,
      parentId: frame.id,
      transform: identityTransform(frameX, frameY),
      content,
      fontSize: style?.fontSize ?? Math.max(28, Math.round(frame.height * 0.045)),
      fontFamily:
        style?.fontFamily ??
        '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
      color: style?.color ?? contentDefaults.textColor,
      strokeColor: style?.strokeColor ?? contentDefaults.textStroke,
      strokeWidth: style?.strokeWidth ?? contentDefaults.textStrokeWidth,
      bold: style?.bold ?? true,
      align: style?.align ?? 'center',
      writingMode: style?.writingMode ?? 'horizontal',
    };

    this.withDoc((d) => {
      const f = d.nodes[frame.id];
      if (!f || !isFrame(f)) return;
      d.nodes[text.id] = text;
      d.nodes[frame.id] = { ...f, children: [...f.children, text.id] };
      d.selection = [text.id];
    });
    return text;
  }

  addBackground(fill: string = contentDefaults.backgroundFill): ShapeNode | null {
    const frame = this.doc ? getActiveFrame(this.doc) : null;
    if (!this.doc || !frame) return null;
    return this.addShape('rect', {
      width: frame.width,
      height: frame.height,
      fill,
      stroke: fill,
      strokeWidth: 0,
      name: '背景',
      atBottom: true,
      locked: true,
      x: 0,
      y: 0,
    });
  }

  addShape(
    shape: ShapeNode['shape'],
    opts?: Partial<
      Pick<ShapeNode, 'width' | 'height' | 'fill' | 'stroke' | 'strokeWidth' | 'name' | 'locked'>
    > & { atBottom?: boolean; x?: number; y?: number },
  ): ShapeNode | null {
    const frame = this.doc ? getActiveFrame(this.doc) : null;
    if (!this.doc || !frame) return null;

    const cd = contentDefaults;
    const defaults: Record<
      ShapeNode['shape'],
      {
        w: number;
        h: number;
        fill: string;
        stroke: string;
        strokeWidth: number;
        name: string;
        cornerRadius?: number;
      }
    > = {
      rect: {
        w: Math.round(frame.width * 0.42),
        h: Math.round(frame.height * 0.18),
        fill: cd.shapeFill,
        stroke: cd.shapeStroke,
        strokeWidth: cd.shapeStrokeWidth,
        name: '矩形',
      },
      roundRect: {
        w: Math.round(frame.width * 0.42),
        h: Math.round(frame.height * 0.18),
        fill: cd.shapeFill,
        stroke: cd.shapeStroke,
        strokeWidth: cd.shapeStrokeWidth,
        name: '圆角矩形',
        cornerRadius: 24,
      },
      ellipse: {
        w: Math.round(Math.min(frame.width, frame.height) * 0.28),
        h: Math.round(Math.min(frame.width, frame.height) * 0.28),
        fill: cd.ellipseFill,
        stroke: cd.shapeStroke,
        strokeWidth: cd.shapeStrokeWidth,
        name: '椭圆',
      },
      triangle: {
        w: Math.round(Math.min(frame.width, frame.height) * 0.28),
        h: Math.round(Math.min(frame.width, frame.height) * 0.28),
        fill: cd.triangleFill,
        stroke: cd.shapeStroke,
        strokeWidth: cd.shapeStrokeWidth,
        name: '三角',
      },
      line: {
        w: Math.round(frame.width * 0.4),
        h: 0,
        fill: 'transparent',
        stroke: cd.lineStroke,
        strokeWidth: cd.lineStrokeWidth,
        name: '直线',
      },
      star: {
        w: Math.round(Math.min(frame.width, frame.height) * 0.22),
        h: Math.round(Math.min(frame.width, frame.height) * 0.22),
        fill: cd.shapeFill,
        stroke: cd.shapeStroke,
        strokeWidth: cd.shapeStrokeWidth,
        name: '星形',
      },
      arrow: {
        w: Math.round(frame.width * 0.35),
        h: Math.round(frame.height * 0.08),
        fill: cd.shapeFill,
        stroke: cd.shapeStroke,
        strokeWidth: cd.shapeStrokeWidth,
        name: '箭头',
      },
    };

    const d = defaults[shape];
    const w = opts?.width ?? d.w;
    const h = opts?.height ?? d.h;
    const x = opts?.x ?? (frame.width - w) / 2;
    const y = opts?.y ?? (frame.height - h) / 2;
    const node: ShapeNode = {
      id: createId('shape'),
      name: opts?.name ?? d.name,
      type: 'shape',
      shape,
      visible: true,
      locked: opts?.locked ?? false,
      opacity: 1,
      parentId: frame.id,
      transform: identityTransform(x, y),
      width: w,
      height: h,
      fill: opts?.fill ?? d.fill,
      stroke: opts?.stroke ?? d.stroke,
      strokeWidth: opts?.strokeWidth ?? d.strokeWidth,
      ...(d.cornerRadius != null ? { cornerRadius: d.cornerRadius } : {}),
    };

    this.withDoc((doc) => {
      const f = doc.nodes[frame.id];
      if (!f || !isFrame(f)) return;
      doc.nodes[node.id] = node;
      const children = opts?.atBottom
        ? [node.id, ...f.children]
        : [...f.children, node.id];
      doc.nodes[frame.id] = { ...f, children };
      doc.selection = [node.id];
    });
    return node;
  }

  /** Swap pixels on an image node; keeps transform and display width/height. */
  replaceImageAsset(
    nodeId: string,
    assetId: string,
    opts?: { name?: string },
  ): boolean {
    if (!this.doc) return false;
    const node = this.doc.nodes[nodeId];
    if (!node || !isImage(node)) return false;

    const prevAssetId = node.assetId;
    this.withDoc((d) => {
      const n = d.nodes[nodeId];
      if (!n || !isImage(n)) return;
      d.nodes[nodeId] = {
        ...n,
        assetId,
        ...(opts?.name ? { name: opts.name } : {}),
      };
    });

    if (prevAssetId !== assetId) {
      this.unrefAssetIfUnused(prevAssetId);
    }
    return true;
  }

  /** Replace asset from ImageData; keeps transform and display size. */
  replaceImageFromPixels(nodeId: string, imageData: ImageData, name?: string): boolean {
    const node = this.doc?.nodes[nodeId];
    if (!node || !isImage(node)) return false;
    const asset = this.assets.putImageData(imageData);
    return this.replaceImageAsset(nodeId, asset.id, { name });
  }

  /** Crop underlying asset; scales display width/height to match cropped region. */
  cropImageNode(nodeId: string, rect: CropRect): boolean {
    if (!this.doc) return false;
    const node = this.doc.nodes[nodeId];
    if (!node || !isImage(node)) return false;
    const asset = this.assets.get(node.assetId);
    if (!asset) return false;

    const cropped = applyCrop(asset.imageData, rect);
    if (cropped.width < 1 || cropped.height < 1) return false;

    const scaleW = cropped.width / asset.width;
    const scaleH = cropped.height / asset.height;

    this.withDoc((d) => {
      const n = d.nodes[nodeId];
      if (!n || !isImage(n)) return;
      d.nodes[nodeId] = {
        ...n,
        width: Math.max(8, Math.round(n.width * scaleW)),
        height: Math.max(8, Math.round(n.height * scaleH)),
      };
    });
    this.assets.replaceImageData(node.assetId, cropped);
    return true;
  }

  private unrefAssetIfUnused(assetId: string): void {
    const doc = this.doc;
    if (!doc) return;
    for (const node of Object.values(doc.nodes)) {
      if (isImage(node) && node.assetId === assetId) return;
    }
    this.assets.remove(assetId);
  }

  addImageFromAsset(
    assetId: string,
    width: number,
    height: number,
    name = '图像',
  ): ImageNode | null {
    const frame = this.doc ? getActiveFrame(this.doc) : null;
    if (!this.doc || !frame) return null;

    const scale = Math.min(frame.width / width, frame.height / height, 1);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const image: ImageNode = {
      id: createId('image'),
      name,
      type: 'image',
      visible: true,
      locked: false,
      opacity: 1,
      parentId: frame.id,
      transform: identityTransform((frame.width - w) / 2, (frame.height - h) / 2),
      assetId,
      width: w,
      height: h,
    };

    this.withDoc((d) => {
      const f = d.nodes[frame.id];
      if (!f || !isFrame(f)) return;
      d.nodes[image.id] = image;
      d.nodes[frame.id] = { ...f, children: [image.id, ...f.children] };
      d.selection = [image.id];
    });
    return image;
  }

  setVisibility(id: string, visible: boolean): void {
    this.updateNode(id, { visible });
  }

  setLocked(id: string, locked: boolean): void {
    this.updateNode(id, { locked });
  }

  rename(id: string, name: string): void {
    this.updateNode(id, { name }, { coalesceKey: `rename:${id}` });
  }

  deleteNodes(ids: string[]): void {
    this.withDoc((d) => {
      const removeDeep = (id: string) => {
        const node = d.nodes[id];
        if (!node || node.type === 'frame') return;
        if (isGroup(node)) {
          for (const childId of [...node.children]) removeDeep(childId);
        }
        const parent = node.parentId ? d.nodes[node.parentId] : null;
        if (parent && (isFrame(parent) || isGroup(parent))) {
          d.nodes[parent.id] = {
            ...parent,
            children: parent.children.filter((c) => c !== id),
          } as SceneNode;
        }
        if (isImage(node)) this.assets.remove(node.assetId);
        delete d.nodes[id];
      };
      for (const id of ids) removeDeep(id);
      d.selection = d.selection.filter((id) => !!d.nodes[id] && d.nodes[id]!.type !== 'frame');
    });
  }

  reorder(id: string, delta: number): void {
    this.withDoc((d) => {
      const node = d.nodes[id];
      if (!node?.parentId) return;
      const parent = d.nodes[node.parentId];
      if (!parent || !isFrame(parent)) return;
      const idx = parent.children.indexOf(id);
      if (idx < 0) return;
      const next = idx + delta;
      if (next < 0 || next >= parent.children.length) return;
      const children = [...parent.children];
      const [item] = children.splice(idx, 1);
      children.splice(next, 0, item!);
      d.nodes[parent.id] = { ...parent, children };
    });
  }

  reorderToDisplayOrder(displayTopToBottom: string[]): void {
    this.withDoc((d) => {
      const frame = getActiveFrame(d);
      if (!frame) return;
      const paintOrder = [...displayTopToBottom].reverse();
      const allowed = new Set(frame.children);
      if (
        paintOrder.length !== frame.children.length ||
        paintOrder.some((id) => !allowed.has(id))
      ) {
        return;
      }
      d.nodes[frame.id] = { ...frame, children: paintOrder };
    });
  }

  undo(): boolean {
    if (!this.doc) return false;
    const prev = this.history.undo(this.doc);
    if (!prev) return false;
    this.doc = prev;
    this.notify();
    return true;
  }

  redo(): boolean {
    if (!this.doc) return false;
    const next = this.history.redo(this.doc);
    if (!next) return false;
    this.doc = next;
    this.notify();
    return true;
  }

  duplicateNodes(ids: string[]): string[] {
    if (!this.doc || ids.length === 0) return [];
    const created: string[] = [];
    this.withDoc((d) => {
      const frame = getActiveFrame(d);
      if (!frame) return;
      const offset = 24;
      const idMap = new Map<string, string>();

      const cloneTree = (id: string, parentId: string): string | null => {
        const src = d.nodes[id];
        if (!src || src.type === 'frame') return null;
        const newId = createId(src.type);
        idMap.set(id, newId);
        if (isGroup(src)) {
          const childIds: string[] = [];
          for (const cid of src.children) {
            const nid = cloneTree(cid, newId);
            if (nid) childIds.push(nid);
          }
          const g: GroupNode = {
            ...structuredClone(src),
            id: newId,
            parentId,
            children: childIds,
            transform: {
              ...src.transform,
              x: src.transform.x + offset,
              y: src.transform.y + offset,
            },
          };
          d.nodes[newId] = g;
          return newId;
        }
        if (isImage(src)) {
          const asset = this.assets.duplicate(src.assetId);
          const assetId = asset?.id ?? src.assetId;
          const img: ImageNode = {
            ...structuredClone(src),
            id: newId,
            parentId,
            assetId,
            transform: {
              ...src.transform,
              x: src.transform.x + offset,
              y: src.transform.y + offset,
            },
          };
          d.nodes[newId] = img;
          return newId;
        }
        const copy = structuredClone(src) as SceneNode;
        copy.id = newId;
        copy.parentId = parentId;
        copy.transform = {
          ...copy.transform,
          x: copy.transform.x + offset,
          y: copy.transform.y + offset,
        };
        d.nodes[newId] = copy;
        return newId;
      };

      const f = d.nodes[frame.id];
      if (!f || !isFrame(f)) return;
      const nextChildren = [...f.children];
      for (const id of ids) {
        if (!f.children.includes(id)) continue;
        const nid = cloneTree(id, frame.id);
        if (nid) {
          nextChildren.push(nid);
          created.push(nid);
        }
      }
      d.nodes[frame.id] = { ...f, children: nextChildren };
      d.selection = created;
    });
    return created;
  }

  groupNodes(ids: string[]): string | null {
    if (!this.doc || ids.length < 2) return null;
    let groupId: string | null = null;
    this.withDoc((d) => {
      const frame = getActiveFrame(d);
      if (!frame) return;
      const f = d.nodes[frame.id];
      if (!f || !isFrame(f)) return;
      const selected = ids.filter((id) => f.children.includes(id) && d.nodes[id]?.type !== 'frame');
      if (selected.length < 2) return;

      let minX = Infinity;
      let minY = Infinity;
      for (const id of selected) {
        const n = d.nodes[id]!;
        minX = Math.min(minX, n.transform.x);
        minY = Math.min(minY, n.transform.y);
      }
      groupId = createId('group');
      const group: GroupNode = {
        id: groupId,
        name: '编组',
        type: 'group',
        visible: true,
        locked: false,
        opacity: 1,
        parentId: frame.id,
        transform: identityTransform(minX, minY),
        children: [],
      };
      for (const id of selected) {
        const n = d.nodes[id]!;
        d.nodes[id] = {
          ...n,
          parentId: groupId,
          transform: {
            ...n.transform,
            x: n.transform.x - minX,
            y: n.transform.y - minY,
          },
        };
        group.children.push(id);
      }
      const remaining = f.children.filter((id) => !selected.includes(id));
      const insertAt = Math.max(
        0,
        ...selected.map((id) => f.children.indexOf(id)).filter((i) => i >= 0),
      );
      remaining.splice(Math.min(insertAt, remaining.length), 0, groupId);
      d.nodes[groupId] = group;
      d.nodes[frame.id] = { ...f, children: remaining };
      d.selection = [groupId];
    });
    return groupId;
  }

  ungroup(groupId: string): void {
    this.withDoc((d) => {
      const group = d.nodes[groupId];
      if (!group || !isGroup(group)) return;
      const parent = group.parentId ? d.nodes[group.parentId] : null;
      if (!parent || !isFrame(parent)) return;
      const gx = group.transform.x;
      const gy = group.transform.y;
      const lifted: string[] = [];
      for (const cid of group.children) {
        const child = d.nodes[cid];
        if (!child) continue;
        d.nodes[cid] = {
          ...child,
          parentId: parent.id,
          transform: {
            ...child.transform,
            x: child.transform.x + gx,
            y: child.transform.y + gy,
          },
        };
        lifted.push(cid);
      }
      const children = parent.children.flatMap((id) => (id === groupId ? lifted : [id]));
      d.nodes[parent.id] = { ...parent, children };
      delete d.nodes[groupId];
      d.selection = lifted;
    });
  }

  flipNodes(ids: string[], axis: 'h' | 'v'): void {
    this.withDoc((d) => {
      for (const id of ids) {
        const node = d.nodes[id];
        if (!node || node.type === 'frame' || node.locked) continue;
        const patch = flipNodeTransform(node, axis, d);
        d.nodes[id] = { ...node, ...patch, transform: patch.transform! } as SceneNode;
      }
    });
  }

  layerOrder(
    ids: string[],
    action: 'front' | 'back' | 'forward' | 'backward',
  ): void {
    this.withDoc((d) => {
      const frame = getActiveFrame(d);
      if (!frame) return;
      const f = d.nodes[frame.id];
      if (!f || !isFrame(f)) return;
      let children = [...f.children];
      const selected = ids.filter((id) => children.includes(id));
      if (selected.length === 0) return;
      const selectedSet = new Set(selected);
      switch (action) {
        case 'front':
          children = [...children.filter((id) => !selectedSet.has(id)), ...selected];
          break;
        case 'back':
          children = [...selected, ...children.filter((id) => !selectedSet.has(id))];
          break;
        case 'forward':
          for (let i = children.length - 2; i >= 0; i--) {
            if (selectedSet.has(children[i]!) && !selectedSet.has(children[i + 1]!)) {
              const a = children[i]!;
              children[i] = children[i + 1]!;
              children[i + 1] = a;
            }
          }
          break;
        case 'backward':
          for (let i = 1; i < children.length; i++) {
            if (selectedSet.has(children[i]!) && !selectedSet.has(children[i - 1]!)) {
              const a = children[i]!;
              children[i] = children[i - 1]!;
              children[i - 1] = a;
            }
          }
          break;
        default: {
          const _e: never = action;
          void _e;
        }
      }
      d.nodes[frame.id] = { ...f, children };
    });
  }

  alignToFrame(ids: string[], edge: AlignEdge): void {
    this.withDoc((d) => {
      const frame = getActiveFrame(d);
      if (!frame) return;
      const patches = alignNodesToFrame(d, frame, ids, edge);
      for (const p of patches) {
        const node = d.nodes[p.id];
        if (!node) continue;
        d.nodes[p.id] = {
          ...node,
          transform: { ...node.transform, x: p.x, y: p.y },
        };
      }
    });
  }

  getActiveFrame(): FrameNode | null {
    return this.doc ? getActiveFrame(this.doc) : null;
  }

  getActivePage(): Page | null {
    return this.doc ? getActivePage(this.doc) : null;
  }

  /** Switch artboard; clears selection. Not recorded in undo. */
  setActivePage(pageId: string): void {
    if (!this.doc) return;
    if (!this.doc.pages.some((p) => p.id === pageId)) return;
    if (this.doc.activePageId === pageId) {
      this.setSelection([]);
      return;
    }
    this.withDoc((d) => {
      d.activePageId = pageId;
      d.selection = [];
    }, { recordHistory: false });
  }

  /** Append a blank page + frame and make it active. */
  addPage(opts: {
    name: string;
    width: number;
    height: number;
    fill?: string;
  }): string | null {
    if (!this.doc) return null;
    const pageId = createId('page');
    const frameId = createId('frame');
    const fill = opts.fill ?? contentDefaults.backgroundFill;
    this.withDoc((d) => {
      const frame: FrameNode = {
        id: frameId,
        name: opts.name,
        type: 'frame',
        visible: true,
        locked: true,
        opacity: 1,
        parentId: null,
        transform: identityTransform(0, 0),
        width: opts.width,
        height: opts.height,
        fill,
        children: [],
      };
      const page: Page = {
        id: pageId,
        name: opts.name,
        frameIds: [frameId],
      };
      d.nodes[frameId] = frame;
      d.pages.push(page);
      d.activePageId = pageId;
      d.selection = [];
    });
    return pageId;
  }

  /**
   * Append a page, run builder(frameId) for nodes, attach + select.
   * Used by Xiaohongshu “add page by card type”.
   */
  addPageWithBuilder(opts: {
    name: string;
    frameName?: string;
    width: number;
    height: number;
    fill?: string;
    build: (frameId: string) => { nodes: SceneNode[]; selectId?: string };
  }): string | null {
    if (!this.doc) return null;
    const pageId = createId('page');
    const frameId = createId('frame');
    const fill = opts.fill ?? contentDefaults.backgroundFill;
    this.withDoc((d) => {
      const built = opts.build(frameId);
      const frame: FrameNode = {
        id: frameId,
        name: opts.frameName ?? opts.name,
        type: 'frame',
        visible: true,
        locked: true,
        opacity: 1,
        parentId: null,
        transform: identityTransform(0, 0),
        width: opts.width,
        height: opts.height,
        fill,
        children: built.nodes.map((n) => n.id),
      };
      const page: Page = {
        id: pageId,
        name: opts.name,
        frameIds: [frameId],
      };
      d.nodes[frameId] = frame;
      for (const n of built.nodes) d.nodes[n.id] = n;
      d.pages.push(page);
      d.activePageId = pageId;
      d.selection = built.selectId ? [built.selectId] : [];
    });
    return pageId;
  }

  /** History-aware full-document mutation (theme apply, etc.). */
  updateDocument(mutator: (draft: StudioDocument) => void): void {
    this.withDoc(mutator);
  }

  renamePage(pageId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.withDoc((d) => {
      const page = d.pages.find((p) => p.id === pageId);
      if (!page) return;
      page.name = trimmed;
      const frameId = page.frameIds[0];
      if (frameId) {
        const frame = d.nodes[frameId];
        if (frame && isFrame(frame)) {
          d.nodes[frameId] = { ...frame, name: trimmed };
        }
      }
    });
  }
}
