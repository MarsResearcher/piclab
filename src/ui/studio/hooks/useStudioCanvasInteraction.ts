import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  DocStore,
  hitTestFrame,
  hitTestResizeHandle,
  hitTestRotateHandle,
  applyBoxResizeLocal,
  applyLineResize,
  applyTextCornerScale,
  applyCenterRotation,
  captureRotateOrigins,
  computeRotateDelta,
  aabbCenter,
  angleFromPivot,
  cursorForHandle,
  isInk,
  getActiveFrame,
  getNodeBounds,
  getNodeBoundsInDoc,
  frameBounds,
  listSiblingBounds,
  snapBounds,
  selectionBounds,
  measureTextBounds,
  isText,
  type GuideLine,
  type InkBrush,
  type ResizeHandle,
  type RotateOrig,
  type SceneNode,
  type Transform2D,
} from '../../../studio';
import type { EditorToolId } from '../StudioToolRail';
import type { TextStyle } from '../textStyle';

/** In-memory studio clipboard (deep-cloned node ids snapshot). */
let studioClipboardIds: string[] = [];

/** Screen-space px before a move counts as a drag (avoids accidental jitter). */
const MOVE_THRESHOLD_PX = 3;

export type View = { scale: number; offsetX: number; offsetY: number };

type MoveDrag = {
  kind: 'move';
  ids: string[];
  startX: number;
  startY: number;
  orig: Record<string, { x: number; y: number }>;
  gestured: boolean;
};

type ResizeDrag = {
  kind: 'resize';
  id: string;
  handle: ResizeHandle;
  origTransform: Transform2D;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  /** Text corner scale via transform (no width/height). */
  textScale?: { ox: number; oy: number; w: number; h: number };
  gestured: boolean;
};

type RotateDrag = {
  kind: 'rotate';
  ids: string[];
  pivotX: number;
  pivotY: number;
  startAngleDeg: number;
  primaryId: string;
  origins: Record<string, RotateOrig>;
  gestured: boolean;
};

type MarqueeDrag = {
  kind: 'marquee';
  startX: number;
  startY: number;
  curX: number;
  curY: number;
  /** Shift / Ctrl / Cmd held at marquee start → union with selection. */
  additive: boolean;
};

type InkDrawDrag = {
  kind: 'ink';
  id: string;
  gestured: boolean;
};

type DragState = MoveDrag | ResizeDrag | RotateDrag | MarqueeDrag | InkDrawDrag;

export type PenStyle = {
  color: string;
  width: number;
  brush: InkBrush;
};

export type UseStudioCanvasInteractionOptions = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  storeRef: RefObject<DocStore>;
  viewRef: RefObject<View>;
  guidesRef: React.MutableRefObject<GuideLine[]>;
  cropImageId: string | null;
  tool: EditorToolId;
  penStyle: PenStyle;
  bump: () => void;
  schedulePaint: () => void;
  fitView: () => void;
  zoomBy: (factor: number, anchor?: { x: number; y: number }) => void;
  /** Keep floating chrome in sync when pan/zoom mutates viewRef. */
  syncView: () => void;
  setEditingId: (id: string | null) => void;
  setTool: (tool: EditorToolId) => void;
  setStatus: (status: string) => void;
  setCropImageId: (id: string | null) => void;
  setShapesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setAssetsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setToolsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setProjectListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setExportMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stepPage: (delta: number) => void;
  /** Props panel「锁定比例」; Shift toggles for the current drag. */
  lockAspectRef: RefObject<boolean>;
  /** Pending text tool style applied on place. */
  textStyleRef: RefObject<TextStyle>;
};

function isAdditiveSelect(e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }) {
  return e.shiftKey || e.ctrlKey || e.metaKey;
}

/** Partial AABB overlap with full-bleed guard (ignore edge-grazing backgrounds). */
function marqueeSelectsBounds(
  b: { x: number; y: number; w: number; h: number },
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  frameW: number,
  frameH: number,
): boolean {
  const overlapW = Math.max(0, Math.min(b.x + b.w, x1) - Math.max(b.x, x0));
  const overlapH = Math.max(0, Math.min(b.y + b.h, y1) - Math.max(b.y, y0));
  if (overlapW <= 0 || overlapH <= 0) return false;
  const nodeArea = b.w * b.h;
  if (nodeArea <= 0) return false;
  const frameArea = frameW * frameH;
  const overlapArea = overlapW * overlapH;
  if (frameArea > 0 && nodeArea / frameArea >= 0.85 && overlapArea / nodeArea < 0.4) {
    return false;
  }
  return true;
}

export function useStudioCanvasInteraction({
  canvasRef,
  storeRef,
  viewRef,
  guidesRef,
  cropImageId,
  tool,
  penStyle,
  bump,
  schedulePaint,
  fitView,
  zoomBy,
  syncView,
  setEditingId,
  setTool,
  setStatus,
  setCropImageId,
  setShapesOpen,
  setAssetsOpen,
  setToolsOpen,
  setProjectListOpen,
  setExportMenuOpen,
  stepPage,
  lockAspectRef,
  textStyleRef,
}: UseStudioCanvasInteractionOptions) {
  const dragRef = useRef<DragState | null>(null);
  const panningRef = useRef<{ x: number; y: number } | null>(null);
  const spaceDownRef = useRef(false);
  const [spaceDown, setSpaceDown] = useState(false);

  const clientToFrame = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const frame = storeRef.current!.getActiveFrame();
      if (!canvas || !frame) return null;
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left - viewRef.current!.offsetX) / viewRef.current!.scale;
      const y = (clientY - rect.top - viewRef.current!.offsetY) / viewRef.current!.scale;
      return { x, y, frame };
    },
    [canvasRef, storeRef, viewRef],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (cropImageId) return;
      const pt = clientToFrame(e.clientX, e.clientY);
      if (!pt) return;
      const doc = storeRef.current!.getDocument();
      if (!doc) return;

      if (e.button === 1 || e.altKey || spaceDownRef.current) {
        panningRef.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      if (tool === 'pen') {
        const ink = storeRef.current!.beginInkStroke(pt.x, pt.y, {
          stroke: penStyle.color,
          strokeWidth: penStyle.width,
          brush: penStyle.brush,
        });
        if (ink) {
          dragRef.current = { kind: 'ink', id: ink.id, gestured: true };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setStatus('\u7ed8\u5236\u4e2d\u2026');
        }
        return;
      }

      if (tool === 'eraser') {
        const hit = hitTestFrame(doc, pt.x, pt.y);
        if (hit && isInk(hit.node) && !hit.node.locked) {
          storeRef.current!.deleteNodes([hit.nodeId]);
          setStatus('\u5df2\u5220\u9664\u7b14\u753b');
        }
        return;
      }

      if (tool === 'text') {
        const hit = hitTestFrame(doc, pt.x, pt.y);
        if (hit && isText(hit.node)) {
          storeRef.current!.setSelection([hit.nodeId]);
          setEditingId(hit.nodeId);
          setTool('select');
          setStatus('Editing text · Enter to finish');
          return;
        }
        const style = textStyleRef.current;
        const text = storeRef.current!.addTextAt(pt.x, pt.y, '', style ?? undefined);
        if (text) {
          setEditingId(text.id);
          setTool('select');
          setStatus('New text · type now');
        }
        return;
      }

      const bounds = selectionBounds(doc, doc.selection);
      if (bounds && hitTestRotateHandle(bounds, pt.x, pt.y, viewRef.current!.scale)) {
        const movable = doc.selection.filter((id) => {
          const n = doc.nodes[id];
          return n && !n.locked;
        });
        if (movable.length) {
          const pivot = aabbCenter(bounds);
          dragRef.current = {
            kind: 'rotate',
            ids: movable,
            pivotX: pivot.x,
            pivotY: pivot.y,
            startAngleDeg: angleFromPivot(pivot, pt),
            primaryId: movable[movable.length - 1]!,
            origins: captureRotateOrigins(doc, movable),
            gestured: false,
          };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
          return;
        }
      }

      const primaryId =
        doc.selection.find((id) => {
          const n = doc.nodes[id];
          return n && !n.locked;
        }) ?? null;
      if (primaryId && doc.selection.length === 1) {
        const selected = doc.nodes[primaryId];
        if (selected) {
          const handle = hitTestResizeHandle(selected, pt.x, pt.y, viewRef.current!.scale);
          if (handle) {
            if (isText(selected)) {
              const b = measureTextBounds(selected);
              dragRef.current = {
                kind: 'resize',
                id: primaryId,
                handle,
                origTransform: { ...selected.transform },
                origX: selected.transform.x,
                origY: selected.transform.y,
                origW: b.w,
                origH: b.h,
                textScale: { ox: b.ox, oy: b.oy, w: b.w, h: b.h },
                gestured: false,
              };
            } else {
              const w = 'width' in selected ? selected.width : 0;
              const h = 'height' in selected ? selected.height : 0;
              dragRef.current = {
                kind: 'resize',
                id: primaryId,
                handle,
                origTransform: { ...selected.transform },
                origX: selected.transform.x,
                origY: selected.transform.y,
                origW: w,
                origH: h,
                gestured: false,
              };
            }
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            return;
          }
        }
      }

      const hit = hitTestFrame(doc, pt.x, pt.y);
      const additive = isAdditiveSelect(e);

      if (hit) {
        let nextSel: string[];
        if (additive) {
          const set = new Set(doc.selection);
          if (set.has(hit.nodeId)) set.delete(hit.nodeId);
          else set.add(hit.nodeId);
          nextSel = [...set];
        } else if (doc.selection.includes(hit.nodeId)) {
          nextSel = doc.selection;
        } else {
          nextSel = [hit.nodeId];
        }
        storeRef.current!.setSelection(nextSel);

        const movable = nextSel.filter((id) => {
          const n = doc.nodes[id];
          return n && !n.locked;
        });
        if (movable.length && !additive) {
          const orig: Record<string, { x: number; y: number }> = {};
          for (const id of movable) {
            const n = doc.nodes[id]!;
            orig[id] = { x: n.transform.x, y: n.transform.y };
          }
          dragRef.current = {
            kind: 'move',
            ids: movable,
            startX: pt.x,
            startY: pt.y,
            orig,
            gestured: false,
          };
        }
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } else {
        dragRef.current = {
          kind: 'marquee',
          startX: pt.x,
          startY: pt.y,
          curX: pt.x,
          curY: pt.y,
          additive,
        };
        if (!additive) {
          storeRef.current!.setSelection([]);
          setEditingId(null);
        }
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    },
    [
      canvasRef,
      clientToFrame,
      cropImageId,
      penStyle.brush,
      penStyle.color,
      penStyle.width,
      setEditingId,
      setStatus,
      setTool,
      storeRef,
      textStyleRef,
      tool,
      viewRef,
    ],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (panningRef.current) {
        const dx = e.clientX - panningRef.current.x;
        const dy = e.clientY - panningRef.current.y;
        panningRef.current = { x: e.clientX, y: e.clientY };
        viewRef.current!.offsetX += dx;
        viewRef.current!.offsetY += dy;
        schedulePaint();
        syncView();
        return;
      }

      const drag = dragRef.current;
      const canvas = canvasRef.current;

      if (!drag) {
        const pt = clientToFrame(e.clientX, e.clientY);
        const doc = storeRef.current!.getDocument();
        if (pt && doc && canvas && !spaceDownRef.current) {
          if (tool === 'pen') {
            canvas.style.cursor = 'crosshair';
            return;
          }
          if (tool === 'eraser') {
            canvas.style.cursor = 'cell';
            return;
          }
          const bounds = selectionBounds(doc, doc.selection);
          if (bounds && hitTestRotateHandle(bounds, pt.x, pt.y, viewRef.current!.scale)) {
            canvas.style.cursor = 'grab';
            return;
          }
          const selectedId = doc.selection.length === 1 ? doc.selection[0]! : null;
          const selected = selectedId ? doc.nodes[selectedId] : null;
          if (selected && !selected.locked) {
            const handle = hitTestResizeHandle(selected, pt.x, pt.y, viewRef.current!.scale);
            if (handle) {
              canvas.style.cursor = cursorForHandle(handle, selected.transform.rotation);
              return;
            }
            const hit = hitTestFrame(doc, pt.x, pt.y);
            canvas.style.cursor =
              hit && doc.selection.includes(hit.nodeId) ? 'grab' : '';
          } else {
            canvas.style.cursor = '';
          }
        }
        return;
      }

      const pt = clientToFrame(e.clientX, e.clientY);
      if (!pt) return;

      if (drag.kind === 'marquee') {
        drag.curX = pt.x;
        drag.curY = pt.y;
        bump();
        return;
      }

      if (drag.kind === 'ink') {
        storeRef.current!.appendInkPoint(drag.id, pt.x, pt.y);
        return;
      }

      if (drag.kind === 'rotate') {
        if (!drag.gestured) {
          storeRef.current!.beginGesture();
          drag.gestured = true;
        }
        if (canvas) canvas.style.cursor = 'grabbing';
        const primaryOrig = drag.origins[drag.primaryId]?.transform.rotation ?? 0;
        const delta = computeRotateDelta({
          pivot: { x: drag.pivotX, y: drag.pivotY },
          cursor: pt,
          startAngleDeg: drag.startAngleDeg,
          primaryOrigRotation: primaryOrig,
          snap15: !e.shiftKey,
        });
        const pivot = { x: drag.pivotX, y: drag.pivotY };
        for (const id of drag.ids) {
          const orig = drag.origins[id];
          if (!orig) continue;
          const next = applyCenterRotation(orig, pivot, delta);
          storeRef.current!.patchTransformSilent(id, next);
        }
        return;
      }

      if (drag.kind === 'resize') {
        if (!drag.gestured) {
          storeRef.current!.beginGesture();
          drag.gestured = true;
        }
        const doc = storeRef.current!.getDocument();
        const node = doc?.nodes[drag.id];
        if (!node) return;

        if (drag.textScale && drag.handle !== 'line-start' && drag.handle !== 'line-end') {
          const next = applyTextCornerScale({
            handle: drag.handle,
            origTransform: drag.origTransform,
            origBounds: drag.textScale,
            cursorFrameX: pt.x,
            cursorFrameY: pt.y,
          });
          storeRef.current!.patchTransformSilent(drag.id, next);
          guidesRef.current = [];
          return;
        }

        const preferLock = lockAspectRef.current;
        const lockAspect = preferLock ? !e.shiftKey : e.shiftKey;
        let result;
        if (drag.handle === 'line-start' || drag.handle === 'line-end') {
          result = applyLineResize({
            handle: drag.handle,
            origX: drag.origX,
            origY: drag.origY,
            origW: drag.origW,
            origH: drag.origH,
            frameX: pt.x,
            frameY: pt.y,
          });
        } else {
          result = applyBoxResizeLocal({
            handle: drag.handle,
            origTransform: drag.origTransform,
            origW: drag.origW,
            origH: drag.origH,
            cursorFrameX: pt.x,
            cursorFrameY: pt.y,
            lockAspect,
          });
        }

        storeRef.current!.patchNodeSilent(drag.id, {
          width: result.width,
          height: result.height,
          transform: {
            ...drag.origTransform,
            x: result.x,
            y: result.y,
          },
        } as Partial<SceneNode>);
        guidesRef.current = [];
        return;
      }

      const dx = pt.x - drag.startX;
      const dy = pt.y - drag.startY;
      const thresh = MOVE_THRESHOLD_PX / Math.max(viewRef.current!.scale, 0.05);
      if (!drag.gestured) {
        if (Math.hypot(dx, dy) < thresh) return;
        storeRef.current!.beginGesture();
        drag.gestured = true;
      }
      if (canvas) canvas.style.cursor = 'grabbing';

      const doc = storeRef.current!.getDocument();
      const frame = doc ? getActiveFrame(doc) : null;
      const primaryId = drag.ids[0];
      const primaryOrig = primaryId ? drag.orig[primaryId] : null;
      let snapDx = 0;
      let snapDy = 0;
      guidesRef.current = [];

      if (doc && frame && primaryId && primaryOrig) {
        const node = doc.nodes[primaryId];
        if (node) {
          const proposedNode = {
            ...node,
            transform: {
              ...node.transform,
              x: primaryOrig.x + dx,
              y: primaryOrig.y + dy,
            },
          } as SceneNode;
          const proposed = getNodeBounds(proposedNode);
          const targets = [frameBounds(frame), ...listSiblingBounds(doc, primaryId)];
          const snapped = snapBounds(proposed, targets, 6);
          snapDx = snapped.x - proposed.x;
          snapDy = snapped.y - proposed.y;
          guidesRef.current = snapped.guides;
        }
      }

      for (const id of drag.ids) {
        const o = drag.orig[id];
        if (!o) continue;
        storeRef.current!.patchTransformSilent(id, {
          x: o.x + dx + snapDx,
          y: o.y + dy + snapDy,
        });
      }
    },
    [
      bump,
      canvasRef,
      clientToFrame,
      guidesRef,
      schedulePaint,
      storeRef,
      syncView,
      tool,
      viewRef,
    ],
  );

  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    if (drag?.kind === 'marquee') {
      const doc = storeRef.current!.getDocument();
      const frame = doc ? getActiveFrame(doc) : null;
      if (doc && frame) {
        const x0 = Math.min(drag.startX, drag.curX);
        const y0 = Math.min(drag.startY, drag.curY);
        const x1 = Math.max(drag.startX, drag.curX);
        const y1 = Math.max(drag.startY, drag.curY);
        const hitIds: string[] = [];
        for (const id of frame.children) {
          const node = doc.nodes[id];
          if (!node || !node.visible || node.locked) continue;
          const b = getNodeBoundsInDoc(doc, node);
          if (
            marqueeSelectsBounds(b, x0, y0, x1, y1, frame.width, frame.height)
          ) {
            hitIds.push(id);
          }
        }
        if (hitIds.length) {
          if (drag.additive) {
            const set = new Set(doc.selection);
            for (const id of hitIds) set.add(id);
            storeRef.current!.setSelection([...set]);
          } else {
            storeRef.current!.setSelection(hitIds);
          }
        }
      }
      dragRef.current = null;
      bump();
      return;
    }
    if (drag) {
      if (drag.kind === 'ink') {
        storeRef.current!.endGesture();
        // Stay unselected so consecutive strokes stay chrome-free in pen mode.
        storeRef.current!.setSelection([]);
        setStatus('\u7b14\u753b\u5df2\u6dfb\u52a0');
      } else if ('gestured' in drag && drag.gestured) {
        storeRef.current!.endGesture();
      }
      dragRef.current = null;
    }
    panningRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = '';
    if (guidesRef.current.length) {
      guidesRef.current = [];
      schedulePaint();
    }
  }, [bump, canvasRef, guidesRef, schedulePaint, setStatus, storeRef]);

  const onDblClick = useCallback(
    (e: React.MouseEvent) => {
      const pt = clientToFrame(e.clientX, e.clientY);
      const doc = storeRef.current!.getDocument();
      if (!pt || !doc) return;
      const { frame } = pt;
      if (pt.x < 0 || pt.y < 0 || pt.x > frame.width || pt.y > frame.height) return;

      const hit = hitTestFrame(doc, pt.x, pt.y);
      if (hit && isText(hit.node)) {
        storeRef.current!.setSelection([hit.nodeId]);
        setEditingId(hit.nodeId);
        setTool('select');
        setStatus('Editing text · Enter to finish');
        return;
      }
      if (hit && !isText(hit.node)) return;

      const text = storeRef.current!.addTextAt(
        pt.x,
        pt.y,
        '',
        textStyleRef.current ?? undefined,
      );
      if (text) {
        setEditingId(text.id);
        setTool('select');
        setStatus('New text · type now');
      }
    },
    [clientToFrame, setEditingId, setStatus, setTool, storeRef, textStyleRef],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      zoomBy(factor, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [canvasRef, zoomBy],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spaceDownRef.current = true;
        setSpaceDown(true);
        setStatus('Space + drag to pan · wheel to zoom');
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomBy(1.15);
        return;
      }
      if (mod && e.key === '-') {
        e.preventDefault();
        zoomBy(1 / 1.15);
        return;
      }
      if (mod && e.key === '0') {
        e.preventDefault();
        fitView();
        return;
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) storeRef.current!.redo();
        else storeRef.current!.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        storeRef.current!.redo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const sel = storeRef.current!.getDocument()?.selection ?? [];
        if (sel.length) storeRef.current!.apply({ type: 'duplicateNodes', ids: sel });
        return;
      }
      if (mod && e.key.toLowerCase() === 'c') {
        const sel = storeRef.current!.getDocument()?.selection ?? [];
        if (sel.length) {
          e.preventDefault();
          studioClipboardIds = [...sel];
          setStatus(`Copied ${sel.length} item(s)`);
        }
        return;
      }
      if (mod && e.key.toLowerCase() === 'v') {
        if (studioClipboardIds.length) {
          e.preventDefault();
          const created = storeRef.current!.duplicateNodes(studioClipboardIds);
          if (created.length) setStatus(`Pasted ${created.length} item(s)`);
        }
        return;
      }
      if (mod && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        const sel = storeRef.current!.getDocument()?.selection ?? [];
        if (e.shiftKey && sel.length === 1) {
          storeRef.current!.apply({ type: 'ungroup', groupId: sel[0]! });
        } else if (sel.length >= 2) {
          storeRef.current!.apply({ type: 'groupNodes', ids: sel });
        }
        return;
      }
      if (e.key === 'Escape') {
        setEditingId(null);
        setCropImageId(null);
        setShapesOpen(false);
        setAssetsOpen(false);
        setToolsOpen(false);
        setProjectListOpen(false);
        setExportMenuOpen(false);
        storeRef.current!.setSelection([]);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const sel = storeRef.current!.getDocument()?.selection ?? [];
        if (sel.length) {
          e.preventDefault();
          storeRef.current!.deleteNodes(sel);
          setEditingId(null);
        }
        return;
      }
      if (e.key === 'PageUp') {
        e.preventDefault();
        stepPage(-1);
        return;
      }
      if (e.key === 'PageDown') {
        e.preventDefault();
        stepPage(1);
        return;
      }
      if (e.key === '[') {
        const sel = storeRef.current!.getDocument()?.selection ?? [];
        if (sel.length) {
          e.preventDefault();
          storeRef.current!.apply({
            type: 'layerOrder',
            ids: sel,
            action: e.shiftKey ? 'back' : 'backward',
          });
        }
        return;
      }
      if (e.key === ']') {
        const sel = storeRef.current!.getDocument()?.selection ?? [];
        if (sel.length) {
          e.preventDefault();
          storeRef.current!.apply({
            type: 'layerOrder',
            ids: sel,
            action: e.shiftKey ? 'front' : 'forward',
          });
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDownRef.current = false;
        setSpaceDown(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    fitView,
    setAssetsOpen,
    setCropImageId,
    setEditingId,
    setExportMenuOpen,
    setProjectListOpen,
    setShapesOpen,
    setStatus,
    setToolsOpen,
    stepPage,
    storeRef,
    zoomBy,
  ]);

  const marqueeStyle = (() => {
    const drag = dragRef.current;
    if (!drag || drag.kind !== 'marquee') return null;
    const x0 = Math.min(drag.startX, drag.curX);
    const y0 = Math.min(drag.startY, drag.curY);
    const x1 = Math.max(drag.startX, drag.curX);
    const y1 = Math.max(drag.startY, drag.curY);
    return {
      left: viewRef.current!.offsetX + x0 * viewRef.current!.scale,
      top: viewRef.current!.offsetY + y0 * viewRef.current!.scale,
      width: Math.max(1, (x1 - x0) * viewRef.current!.scale),
      height: Math.max(1, (y1 - y0) * viewRef.current!.scale),
    } as React.CSSProperties;
  })();

  return {
    spaceDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onDblClick,
    onWheel,
    marqueeStyle,
  };
}
