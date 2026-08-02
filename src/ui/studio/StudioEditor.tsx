import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AssetStore,
  DocStore,
  StudioRenderer,
  DEFAULT_XHS_THEME,
  XHS_CARD_TYPES,
  XHS_H,
  XHS_W,
  applyXhsTheme,
  buildXhsCardNodes,
  getXhsPalette,
  parseXhsCardTypeFromFrame,
  resolveXhsTheme,
  xhsFrameName,
  isImage,
  isInk,
  isShape,
  getActiveFrame,
  selectionBounds,
  isText,
  measureTextBounds,
  registerBuiltinTools,
  createProjectFromScene,
  scheduleProjectSave,
  type GuideLine,
  type InkBrush,
  type SceneNode,
  type ShapeKind,
  type TextNode,
  type XhsCardTypeId,
  type XhsTheme,
  type XhsTextCardStyle,
  exportAllPagesZip,
  exportAllPagesPdf,
  type ExportPixelScale,
} from '../../studio';
import { ensureSampleInLibrary } from '../../core/library';
import { APP_VERSION } from '../../appMeta';
import { NodeTreePanel } from './NodeTreePanel';
import { PropsPanel } from './PropsPanel';
import { TextEditOverlay } from './TextEditOverlay';
import { SelectionToolbar } from './SelectionToolbar';
import { ImageContextBar } from './ImageContextBar';
import { TypeContextBar, PendingTextStyleBar, hasTypeContextBar } from './TypeContextBar';
import { XhsTextCardBar } from './XhsTextCardBar';
import { XhsThemeBar } from './XhsThemeBar';
import {
  DEFAULT_TEXT_STYLE,
  mergeTextStyle,
  type TextStyle,
} from './textStyle';
import { StudioCropOverlay } from './StudioCropOverlay';
import { StudioTopBar } from './StudioTopBar';
import { StudioToolRail, type EditorToolId } from './StudioToolRail';
import { StudioCanvasChrome } from './StudioCanvasChrome';
import { TemplatePicker } from './TemplatePicker';
import { LiteHome } from './LiteHome';
import { PreviewModal, type PreviewPage } from './PreviewModal';
import { PageStrip } from './PageStrip';
import { LibraryDrawer } from '../LibraryDrawer';
import { ExportPanel } from '../ExportPanel';
import { BatchExportPanel } from '../BatchExportPanel';
import {
  createGradientBlockImageData,
  generateQrImageData,
  type QrLiteParams,
} from '../../studio/plugins/liteTools';
import { useStudioCanvasInteraction, type View } from './hooks/useStudioCanvasInteraction';
import { useStudioProjectSession } from './hooks/useStudioProjectSession';
import { STATUS, UI } from './uiLabels';
import { displayProjectTitle } from './projectDisplay';
import { placeObjectChrome, stackObjectChrome } from './floatingChrome';
import { collectImagePalettes } from './controls';
import type { ImageMask } from '../../studio';

registerBuiltinTools();

type Props = {
  onOpenLab?: () => void;
  landing?: 'home' | 'editor';
  onLandingChange?: (landing: 'home' | 'editor') => void;
};

async function blobToImageData(blob: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob);
  const c = document.createElement('canvas');
  c.width = bitmap.width;
  c.height = bitmap.height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}

export function StudioEditor({ onOpenLab, landing = 'home', onLandingChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const assetsRef = useRef(new AssetStore());
  const storeRef = useRef(new DocStore(assetsRef.current));
  const rendererRef = useRef(new StudioRenderer(assetsRef.current));
  const fittedOnceRef = useRef(false);
  const propsGestureRef = useRef(false);
  const libraryIdRef = useRef<string | null>(null);
  const rafPaintRef = useRef(0);

  const [tick, setTick] = useState(0);
  const [tool, setTool] = useState<EditorToolId>('select');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportImage, setExportImage] = useState<ImageData | null>(null);
  const [previewPages, setPreviewPages] = useState<PreviewPage[] | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryMode, setLibraryMode] = useState<'insert' | 'replace'>('insert');
  const [replaceNodeId, setReplaceNodeId] = useState<string | null>(null);
  const [cropImageId, setCropImageId] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [penOpen, setPenOpen] = useState(false);
  const [penColor, setPenColor] = useState('#1a1a1a');
  const [penWidth, setPenWidth] = useState(3);
  const [penBrush, setPenBrush] = useState<InkBrush>('pen');
  const [liteToolsBusy, setLiteToolsBusy] = useState(false);
  const [stripKey, setStripKey] = useState(0);
  const [status, setStatus] = useState<string>(STATUS.idle);
  const [layersOpen, setLayersOpen] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);
  const [viewScale, setViewScale] = useState(1);
  /** Bumps on pan/zoom so floating chrome re-reads viewRef (scale alone may not change). */
  const [viewEpoch, setViewEpoch] = useState(0);
  /** Print export bleed in mm (0 = off, 3 = standard). */
  const [exportBleedMm, setExportBleedMm] = useState(0);
  /** Export raster scale: 1 ?? / 2 ?? / 3 ??. Default ??. */
  const [exportPixelScale, setExportPixelScale] = useState<ExportPixelScale>(2);
  /** Shared by props panel + canvas resize (Shift temporarily inverts). */
  const [lockAspect, setLockAspect] = useState(true);
  const lockAspectRef = useRef(true);
  lockAspectRef.current = lockAspect;
  /** Text tool pending style (applied on place; synced from edited text). */
  const [textStyle, setTextStyle] = useState<TextStyle>(DEFAULT_TEXT_STYLE);
  const textStyleRef = useRef(textStyle);
  textStyleRef.current = textStyle;

  const viewRef = useRef<View>({ scale: 1, offsetX: 40, offsetY: 40 });
  const guidesRef = useRef<GuideLine[]>([]);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  const paintCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const doc = storeRef.current.getDocument();
    if (!canvas || !doc) return;
    rendererRef.current.drawToViewport(
      canvas,
      doc,
      viewRef.current,
      guidesRef.current,
    );
  }, []);

  const schedulePaint = useCallback(() => {
    if (rafPaintRef.current) return;
    rafPaintRef.current = requestAnimationFrame(() => {
      rafPaintRef.current = 0;
      paintCanvas();
    });
  }, [paintCanvas]);

  useEffect(() => {
    return storeRef.current.subscribe(() => {
      const gesturing = storeRef.current.isGesturing();
      if (gesturing) {
        schedulePaint();
        return;
      }
      paintCanvas();
      bump();
      scheduleProjectSave(storeRef.current.getDocument(), assetsRef.current);
    });
  }, [paintCanvas, schedulePaint, bump]);

  const viewSyncRaf = useRef(0);
  const syncView = useCallback(() => {
    if (viewSyncRaf.current) return;
    viewSyncRaf.current = requestAnimationFrame(() => {
      viewSyncRaf.current = 0;
      setViewScale(viewRef.current.scale);
      setViewEpoch((n) => n + 1);
    });
  }, []);

  const fitView = useCallback(() => {
    const canvas = canvasRef.current;
    const frame = storeRef.current.getActiveFrame();
    if (!canvas || !frame) return;
    const pad = 48;
    const cssW = canvas.clientWidth || 800;
    const cssH = canvas.clientHeight || 600;
    const scale = Math.min((cssW - pad) / frame.width, (cssH - pad) / frame.height, 1);
    viewRef.current = {
      scale: Math.max(0.05, scale),
      offsetX: (cssW - frame.width * scale) / 2,
      offsetY: (cssH - frame.height * scale) / 2,
    };
    syncView();
    paintCanvas();
  }, [paintCanvas, syncView]);

  const zoomBy = useCallback(
    (factor: number, anchor?: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = anchor?.x ?? rect.width / 2;
      const y = anchor?.y ?? rect.height / 2;
      const before = viewRef.current.scale;
      const after = Math.min(8, Math.max(0.05, before * factor));
      const wx = (x - viewRef.current.offsetX) / before;
      const wy = (y - viewRef.current.offsetY) / before;
      viewRef.current.scale = after;
      viewRef.current.offsetX = x - wx * after;
      viewRef.current.offsetY = y - wy * after;
      syncView();
      schedulePaint();
    },
    [schedulePaint, syncView],
  );

  const zoomTo = useCallback(
    (scale: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const factor = scale / viewRef.current.scale;
      zoomBy(factor);
    },
    [zoomBy],
  );

  const {
    sceneId,
    project,
    projects,
    projectListOpen,
    setProjectListOpen,
    saveStatus,
    templateOpen,
    setTemplateOpen,
    screen,
    ready,
    applyBootstrap,
    refreshProjectList,
    onNewProject,
    onTemplatePick,
    onOpenProjectFromHome,
    onContinueFromHome,
    onGoHome,
    onSaveAsTemplate,
    onOpenProject,
    onRenameProject,
    onDeleteProject,
  } = useStudioProjectSession({
    landing,
    onLandingChange,
    storeRef,
    assetsRef,
    rendererRef,
    fittedOnceRef,
    fitView,
    setEditingId,
    setExportOpen,
    setBatchOpen,
    setExportImage,
    setPreviewPages,
    setStatus,
    onStripRefresh: () => setStripKey((k) => k + 1),
  });

  const [xhsTheme, setXhsTheme] = useState<XhsTheme>({ ...DEFAULT_XHS_THEME });

  useEffect(() => {
    if (sceneId !== 'xhsNote') return;
    setXhsTheme({ ...DEFAULT_XHS_THEME });
  }, [project?.id, sceneId]);

  const applyXhsThemeChange = useCallback(
    (next: XhsTheme) => {
      const theme = resolveXhsTheme(next);
      setXhsTheme(theme);
      storeRef.current.beginTransaction('xhs-theme');
      storeRef.current.updateDocument((d) => {
        applyXhsTheme(d, theme);
      });
      storeRef.current.commitTransaction();
      setStatus('\u5df2\u5e94\u7528\u4e3b\u9898');
      paintCanvas();
    },
    [paintCanvas],
  );

  const addXhsCardPage = useCallback(
    (cardTypeId: string) => {
      const cardType = cardTypeId as XhsCardTypeId;
      const meta = XHS_CARD_TYPES.find((c) => c.id === cardType);
      if (!meta) return;
      const pal = getXhsPalette(xhsTheme.palette);
      const id = storeRef.current.addPageWithBuilder({
        name: meta.label,
        frameName: xhsFrameName(cardType),
        width: XHS_W,
        height: XHS_H,
        fill: pal.bg,
        build: (frameId) => buildXhsCardNodes(frameId, cardType, xhsTheme),
      });
      if (id) {
        setEditingId(null);
        requestAnimationFrame(() => fitView());
        setStatus(`\u5df2\u6dfb\u52a0\u00b7${meta.label}`);
      }
    },
    [fitView, xhsTheme],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const ro = new ResizeObserver(() => {
      if (!fittedOnceRef.current) {
        fitView();
        fittedOnceRef.current = true;
      } else {
        paintCanvas();
      }
    });
    ro.observe(canvas.parentElement ?? canvas);
    return () => ro.disconnect();
  }, [fitView, ready, paintCanvas]);

  /** Layers drawer changes stage width \u2014 re-fit so the frame is not clipped. */
  useEffect(() => {
    if (!ready || !fittedOnceRef.current) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) fitView();
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [layersOpen, ready, fitView]);

  const addImageData = useCallback(
    async (data: ImageData, name: string) => {
      if (!storeRef.current.getDocument() || sceneId === 'retouch') {
        const result = await createProjectFromScene(sceneId, assetsRef.current, {
          fromImage: data,
        });
        applyBootstrap(result, `Project \u00b7 ${result.project.name}`);
        return;
      }
      const asset = assetsRef.current.putImageData(data);
      storeRef.current.addImageFromAsset(asset.id, data.width, data.height, name);
      setStatus(`Added \u00b7 ${name}`);
    },
    [applyBootstrap, sceneId],
  );

  const importBlob = useCallback(
    async (blob: Blob, name: string, libraryId?: string) => {
      if (libraryId) libraryIdRef.current = libraryId;
      const data = await blobToImageData(blob);
      if (replaceNodeId) {
        const ok = storeRef.current.replaceImageFromPixels(replaceNodeId, data, name);
        setReplaceNodeId(null);
        setLibraryMode('insert');
        setStatus(ok ? `Replaced \u00b7 ${name}` : 'Replace failed');
        setStripKey((k) => k + 1);
        return;
      }
      await addImageData(data, name);
      setStripKey((k) => k + 1);
    },
    [addImageData, replaceNodeId],
  );

  const replaceImageFile = useCallback(async (nodeId: string, file: File) => {
    try {
      const data = await blobToImageData(file);
      const ok = storeRef.current.replaceImageFromPixels(nodeId, data, file.name);
      setStatus(ok ? `Replaced \u00b7 ${file.name}` : 'Replace failed');
    } catch {
      setStatus('Replace failed');
    }
  }, []);

  const openLibraryReplace = useCallback((nodeId: string) => {
    setReplaceNodeId(nodeId);
    setLibraryMode('replace');
    setLibraryOpen(true);
  }, []);

  const applyCrop = useCallback(
    (nodeId: string, rect: { x: number; y: number; width: number; height: number }) => {
      const ok = storeRef.current.cropImageNode(nodeId, rect);
      setCropImageId(null);
      setStatus(ok ? 'Cropped' : 'Crop failed');
    },
    [],
  );

  const insertQr = useCallback(
    async (params: QrLiteParams) => {
      const frame = storeRef.current.getActiveFrame();
      if (!frame) return;
      setLiteToolsBusy(true);
      try {
        const data = await generateQrImageData(params);
        const asset = assetsRef.current.putImageData(data);
        const label = params.text.trim().slice(0, 16) || '\u4e8c\u7ef4\u7801';
        storeRef.current.addImageFromAsset(asset.id, data.width, data.height, label);
        setToolsOpen(false);
        setStatus(`Inserted QR \u00b7 ${label}`);
      } catch {
        setStatus('QR failed \u00b7 editing continues');
      } finally {
        setLiteToolsBusy(false);
      }
    },
    [],
  );

  const insertGradient = useCallback(() => {
    const frame = storeRef.current.getActiveFrame();
    if (!frame) return;
    const w = Math.round(frame.width * 0.5);
    const h = Math.round(frame.height * 0.22);
    const data = createGradientBlockImageData(w, h);
    const asset = assetsRef.current.putImageData(data);
    storeRef.current.addImageFromAsset(asset.id, w, h, '\u6e10\u53d8\u5757');
    setToolsOpen(false);
    setStatus('Inserted gradient block');
  }, []);

  const loadSample = useCallback(async () => {
    setStatus('Loading sample\u2026');
    try {
      const seeded = await ensureSampleInLibrary();
      if (seeded) {
        await importBlob(seeded.blob, seeded.name, seeded.id);
        return;
      }
      const res = await fetch('/samples/lab-sample.jpg');
      if (!res.ok) throw new Error('sample missing');
      await importBlob(await res.blob(), 'sample');
    } catch {
      setStatus('Sample failed');
    }
  }, [importBlob]);

  const openExport = (batch: boolean) => {
    const d = storeRef.current.getDocument();
    if (!d) return;
    const flat = rendererRef.current.flatten(d, undefined, {
      pixelScale: exportPixelScale,
    });
    if (!flat) return;
    setExportImage(flat);
    setExportOpen(!batch);
    setBatchOpen(batch);
    setExportMenuOpen(false);
  };

  const cycleExportScale = useCallback(() => {
    setExportPixelScale((s) => (s === 1 ? 2 : s === 2 ? 3 : 1));
  }, []);

  const exportAllPages = useCallback(async () => {
    const d = storeRef.current.getDocument();
    if (!d) return;
    setExportMenuOpen(false);
    try {
      const count = await exportAllPagesZip(
        rendererRef.current,
        d,
        project?.name ?? d.name ?? 'piclab',
        {
          useExportHints: true,
          bleedMm: exportBleedMm,
          pixelScale: exportPixelScale,
        },
      );
      const bleedNote =
        exportBleedMm > 0 ? ` \u00b7 ${exportBleedMm}mm \u51fa\u8840` : '';
      const scaleNote = exportPixelScale > 1 ? ` \u00b7 ${exportPixelScale}\u00d7` : '';
      setStatus(
        count > 0
          ? `\u5df2\u6253\u5305 ZIP\uff08${count} \u9762${scaleNote}${bleedNote}\uff09`
          : '\u5bfc\u51fa\u5931\u8d25',
      );
    } catch {
      setStatus('ZIP \u5bfc\u51fa\u5931\u8d25');
    }
  }, [exportBleedMm, exportPixelScale, project?.name]);

  const exportPdf = useCallback(async () => {
    const d = storeRef.current.getDocument();
    if (!d) return;
    setExportMenuOpen(false);
    try {
      const count = await exportAllPagesPdf(
        rendererRef.current,
        d,
        project?.name ?? d.name ?? 'piclab',
        {
          useExportHints: true,
          bleedMm: exportBleedMm,
          pixelScale: exportPixelScale,
          jpegQuality: exportPixelScale >= 3 ? 0.95 : 0.92,
        },
      );
      const bleedNote =
        exportBleedMm > 0 ? ` \u00b7 ${exportBleedMm}mm \u51fa\u8840` : '';
      const scaleNote = exportPixelScale > 1 ? ` \u00b7 ${exportPixelScale}\u00d7` : '';
      setStatus(
        count > 0
          ? `\u5df2\u5bfc\u51fa PDF\uff08${count} \u9875${scaleNote}${bleedNote}\uff09`
          : '\u5bfc\u51fa\u5931\u8d25',
      );
    } catch {
      setStatus('PDF \u5bfc\u51fa\u5931\u8d25');
    }
  }, [exportBleedMm, exportPixelScale, project?.name]);

  const openPreview = () => {
    const d = storeRef.current.getDocument();
    if (!d) return;
    const pages: PreviewPage[] = [];
    for (const page of d.pages) {
      const frameId = page.frameIds[0];
      if (!frameId) continue;
      const flat = rendererRef.current.flatten(d, frameId);
      if (flat) pages.push({ name: page.name, imageData: flat });
    }
    if (pages.length) setPreviewPages(pages);
  };

  const selectPage = useCallback(
    (pageId: string) => {
      storeRef.current.setActivePage(pageId);
      setEditingId(null);
      requestAnimationFrame(() => fitView());
      setStatus(STATUS.pageSwitched);
    },
    [fitView],
  );

  const addPage = useCallback(() => {
    const d = storeRef.current.getDocument();
    const frame = d ? getActiveFrame(d) : null;
    const w = frame?.width ?? (sceneId === 'xhsNote' ? XHS_W : 1080);
    const h = frame?.height ?? (sceneId === 'xhsNote' ? XHS_H : 1080);
    const name = `\u9875\u9762 ${(d?.pages.length ?? 0) + 1}`;
    const fill =
      sceneId === 'xhsNote'
        ? getXhsPalette(xhsTheme.palette).bg
        : (frame?.fill ?? '#22252c');
    const id = storeRef.current.addPage({
      name,
      width: w,
      height: h,
      fill,
    });
    if (id) {
      setEditingId(null);
      requestAnimationFrame(() => fitView());
      setStatus(`Added ${name}`);
    }
  }, [fitView, sceneId, xhsTheme.palette]);

  const stepPage = useCallback(
    (delta: number) => {
      const d = storeRef.current.getDocument();
      if (!d || d.pages.length < 2) return;
      const idx = d.pages.findIndex((p) => p.id === d.activePageId);
      if (idx < 0) return;
      const next = d.pages[idx + delta];
      if (next) selectPage(next.id);
    },
    [selectPage],
  );

  const {
    spaceDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onDblClick,
    onWheel,
    marqueeStyle,
  } = useStudioCanvasInteraction({
    canvasRef,
    storeRef,
    viewRef,
    guidesRef,
    cropImageId,
    tool,
    penStyle: { color: penColor, width: penWidth, brush: penBrush },
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
  });

  const doc = storeRef.current.getDocument();
  const selectedId = doc?.selection[0];
  const selected = selectedId ? (doc?.nodes[selectedId] ?? null) : null;
  const selectedImage =
    selectedId && selected && isImage(selected) ? selected : null;
  // tick drives recompute when assets/nodes change.
  void tick;
  const imagePalettes = collectImagePalettes(doc, assetsRef.current);

  useEffect(() => {
    if (!selected) return;
    if (isImage(selected)) setLockAspect(true);
    else if (isShape(selected) && selected.shape !== 'line') setLockAspect(false);
  }, [selected?.id]);
  const frame = doc ? getActiveFrame(doc) : null;
  const canExport = !!frame;
  void tick;

  const cropOverlay = (() => {
    if (!cropImageId || !doc || !canvasRef.current) return null;
    const node = doc.nodes[cropImageId];
    if (!node || !isImage(node)) return null;
    const asset = assetsRef.current.get(node.assetId);
    if (!asset) return null;
    if (Math.abs(node.transform.rotation) > 0.5) return null;
    const left = viewRef.current.offsetX + node.transform.x * viewRef.current.scale;
    const top = viewRef.current.offsetY + node.transform.y * viewRef.current.scale;
    return {
      nodeId: cropImageId,
      assetWidth: asset.width,
      assetHeight: asset.height,
      screenRect: {
        left,
        top,
        width: node.width * viewRef.current.scale,
        height: node.height * viewRef.current.scale,
      },
    };
  })();

  const showPendingTextBar =
    tool === 'text' && !editingId && !cropImageId && !(selected && isText(selected));

  const reserveTypeBar =
    showPendingTextBar ||
    (!!selected &&
      !!doc &&
      doc.selection.length === 1 &&
      hasTypeContextBar(selected) &&
      !editingId &&
      !cropImageId);

  const toolbarPos = (() => {
    void viewEpoch;
    void viewScale;
    if (!doc || !doc.selection.length || !stageRef.current) return null;
    const b = selectionBounds(doc, doc.selection);
    if (!b) return null;
    const stage = stageRef.current;
    const stackExtra = selectedImage && !cropImageId ? 42 : 0;
    return placeObjectChrome({
      bounds: b,
      offsetX: viewRef.current.offsetX,
      offsetY: viewRef.current.offsetY,
      scale: viewRef.current.scale,
      stageWidth: stage.clientWidth,
      stageHeight: stage.clientHeight,
      reserveTypeBar,
      stackExtra,
    });
  })();

  /** Image mask/crop bar stacks with selection pill (same side, clamped). */
  const imageBarPos = (() => {
    if (!doc || !selectedImage || cropImageId || !stageRef.current || !toolbarPos) {
      return null;
    }
    return stackObjectChrome(
      toolbarPos,
      stageRef.current.clientHeight,
      reserveTypeBar,
    );
  })();


  const editingNode =
    editingId && doc?.nodes[editingId] && isText(doc.nodes[editingId]!)
      ? (doc.nodes[editingId] as TextNode)
      : null;

  const textEditStyle = (() => {
    if (!editingNode || !canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const b = measureTextBounds(editingNode);
    const vx =
      viewRef.current.offsetX +
      (editingNode.transform.x + b.ox + b.w / 2) * viewRef.current.scale;
    const vy =
      viewRef.current.offsetY +
      (editingNode.transform.y + b.oy) * viewRef.current.scale;
    const left = Math.min(Math.max(12, vx), rect.width - 12);
    const top = Math.min(Math.max(12, vy - 8), rect.height - 48);
    return { left, top, transform: 'translate(-50%, -100%)' } as React.CSSProperties;
  })();

  const insertShape = (shape: ShapeKind) => {
    const n = storeRef.current.addShape(shape);
    if (n) {
      setTool('select');
      setShapesOpen(false);
      setStatus(`Inserted ${n.name}`);
    }
  };

  const insertBackground = () => {
    const n = storeRef.current.addBackground('#2a3344');
    if (n) {
      setTool('select');
      setShapesOpen(false);
      setStatus('Background added \u00b7 edit fill on the right');
    }
  };

  const ensureTextGesture = () => {
    if (!propsGestureRef.current) {
      storeRef.current.beginGesture();
      propsGestureRef.current = true;
    }
  };

  const finishTextEdit = (_commit: boolean) => {
    if (propsGestureRef.current) {
      storeRef.current.endGesture();
      propsGestureRef.current = false;
    }
    setEditingId(null);
    setStatus(STATUS.textUpdated);
  };

  if (screen === 'home' && ready) {
    return (
      <LiteHome
        onPick={onTemplatePick}
        onOpenProject={onOpenProjectFromHome}
        onContinue={onContinueFromHome}
      />
    );
  }

  return (
    <div className={`studio ${layersOpen ? 'layers-open' : ''}`}>
      <StudioTopBar
        project={project}
        projects={projects}
        projectListOpen={projectListOpen}
        saveStatus={saveStatus}
        canUndo={storeRef.current.history.canUndo()}
        canRedo={storeRef.current.history.canRedo()}
        canExport={canExport}
        exportMenuOpen={exportMenuOpen}
        onToggleProjectList={() => {
          setProjectListOpen((o) => !o);
          void refreshProjectList();
        }}
        onNew={onNewProject}
        onOpen={onOpenProject}
        onRename={onRenameProject}
        onDelete={onDeleteProject}
        onUndo={() => storeRef.current.undo()}
        onRedo={() => storeRef.current.redo()}
        onFit={fitView}
        onPreview={openPreview}
        onExport={() => openExport(false)}
        onExportAll={() => void exportAllPages()}
        onExportPdf={() => void exportPdf()}
        onBatch={() => openExport(true)}
        onToggleExportMenu={() => setExportMenuOpen((o) => !o)}
        exportBleedMm={exportBleedMm}
        onToggleExportBleed={() => setExportBleedMm((mm) => (mm > 0 ? 0 : 3))}
        exportPixelScale={exportPixelScale}
        onCycleExportScale={cycleExportScale}
        onOpenLab={onOpenLab}
        onGoHome={onGoHome}
        onSaveAsTemplate={onSaveAsTemplate}
        multiPage={(doc?.pages.length ?? 0) > 1}
      />

      <div className="studio-body">
        <StudioToolRail
          tool={tool}
          layersOpen={layersOpen}
          assetsOpen={assetsOpen}
          shapesOpen={shapesOpen}
          toolsOpen={toolsOpen}
          penOpen={penOpen}
          liteToolsBusy={liteToolsBusy}
          stripKey={stripKey}
          penColor={penColor}
          penWidth={penWidth}
          penBrush={penBrush}
          onTool={(t) => {
            setTool(t);
            setShapesOpen(false);
            setToolsOpen(false);
            if (t !== 'pen' && t !== 'eraser') setPenOpen(false);
            if (t === 'text') setStatus(STATUS.textTool);
            if (t === 'pen') {
              storeRef.current.setSelection([]);
              setStatus(STATUS.penTool);
            }
            if (t === 'eraser') {
              storeRef.current.setSelection([]);
              setStatus(STATUS.eraserTool);
            }
            if (t === 'select') setStatus(STATUS.idle);
          }}
          onToggleLayers={() => {
            setLayersOpen((o) => !o);
            setAssetsOpen(false);
            setShapesOpen(false);
            setToolsOpen(false);
            setPenOpen(false);
          }}
          onToggleAssets={() => {
            setAssetsOpen((o) => !o);
            setShapesOpen(false);
            setToolsOpen(false);
            setPenOpen(false);
          }}
          onToggleShapes={() => {
            setShapesOpen((o) => !o);
            setAssetsOpen(false);
            setToolsOpen(false);
            setPenOpen(false);
          }}
          onToggleTools={() => {
            setToolsOpen((o) => !o);
            setShapesOpen(false);
            setAssetsOpen(false);
            setPenOpen(false);
          }}
          onTogglePen={() => {
            setPenOpen((o) => !o);
            setShapesOpen(false);
            setAssetsOpen(false);
            setToolsOpen(false);
          }}
          onPenColor={setPenColor}
          onPenWidth={setPenWidth}
          onPenBrush={setPenBrush}
          onBakeInk={() => {
            const d = storeRef.current.getDocument();
            const sel = d?.selection.filter((id) => {
              const n = d.nodes[id];
              return n && isInk(n);
            });
            const img = storeRef.current.bakeInkToImage(
              sel && sel.length ? sel : undefined,
            );
            if (img) {
              setTool('select');
              setPenOpen(false);
              setStatus(STATUS.inkBaked);
            } else {
              setStatus(STATUS.inkBakeEmpty);
            }
          }}
          onInsertShape={insertShape}
          onInsertBackground={insertBackground}
          onInsertQr={(params) => void insertQr(params)}
          onInsertGradient={insertGradient}
          onOpenLibrary={() => {
            setLibraryMode('insert');
            setReplaceNodeId(null);
            setLibraryOpen(true);
          }}
          onImportFile={(f) => void importBlob(f, f.name)}
          onLoadSample={() => void loadSample()}
          onPickSample={(blob, name, id) => void importBlob(blob, name, id)}
        />

        {layersOpen && (
          <aside className="studio-layers-drawer glass">
            <div className="block-head">
              <h3>{UI.layers}</h3>
            </div>
            {doc ? (
              <NodeTreePanel
                doc={doc}
                onSelect={(id) => {
                  storeRef.current.setSelection([id]);
                  setEditingId(null);
                }}
                onToggleVisible={(id) => {
                  const n = storeRef.current.getDocument()?.nodes[id];
                  if (n) storeRef.current.setVisibility(id, !n.visible);
                }}
                onToggleLocked={(id) => {
                  const n = storeRef.current.getDocument()?.nodes[id];
                  if (n) storeRef.current.setLocked(id, !n.locked);
                }}
                onDelete={(id) => storeRef.current.deleteNodes([id])}
                onRename={(id, name) => storeRef.current.rename(id, name)}
                onReorderDisplay={(ids) => storeRef.current.reorderToDisplayOrder(ids)}
                onLoadSample={() => void loadSample()}
              />
            ) : (
              <p className="hint">{UI.loading}</p>
            )}
          </aside>
        )}

        <main className={`studio-stage ${spaceDown ? 'panning' : ''}`} ref={stageRef}>
          <canvas
            ref={canvasRef}
            className="studio-canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={onDblClick}
            onWheel={onWheel}
          />
          {editingNode && (
            <TextEditOverlay
              node={editingNode}
              style={textEditStyle}
              onLiveChange={(content) => {
                ensureTextGesture();
                storeRef.current.patchNodeSilent(editingNode.id, {
                  content,
                  name: content.slice(0, 16) || 'Text',
                });
                schedulePaint();
              }}
              onCommit={() => finishTextEdit(true)}
              onCancel={() => finishTextEdit(false)}
            />
          )}
          {toolbarPos && !editingNode && !cropImageId && (
            <SelectionToolbar
              store={storeRef.current}
              screenX={toolbarPos.x}
              screenY={toolbarPos.y}
              placement={toolbarPos.placement}
              onDelete={() => {
                const sel = storeRef.current.getDocument()?.selection ?? [];
                if (sel.length) {
                  storeRef.current.deleteNodes(sel);
                  setEditingId(null);
                }
              }}
            />
          )}
          {showPendingTextBar && (
            <div className="studio-type-bar-dock">
              <PendingTextStyleBar
                style={textStyle}
                imagePalettes={imagePalettes}
                onChange={(patch) => setTextStyle((s) => mergeTextStyle(s, patch))}
              />
            </div>
          )}
          {selected &&
            doc?.selection.length === 1 &&
            hasTypeContextBar(selected) &&
            !editingNode &&
            !cropImageId &&
            !showPendingTextBar && (
              <div className="studio-type-bar-dock">
                <TypeContextBar
                  node={selected}
                  imagePalettes={imagePalettes}
                  onBakeInk={
                    isInk(selected)
                      ? () => {
                          const img = storeRef.current.bakeInkToImage([selected.id]);
                          if (img) setStatus(STATUS.inkBaked);
                        }
                      : undefined
                  }
                  onBegin={() => {
                    if (!propsGestureRef.current) {
                      storeRef.current.beginTransaction(`typebar:${selected.id}`);
                      propsGestureRef.current = true;
                    }
                  }}
                  onEnd={() => {
                    if (propsGestureRef.current) {
                      storeRef.current.commitTransaction();
                      propsGestureRef.current = false;
                    }
                  }}
                  onPatch={(patch) => {
                    if (!propsGestureRef.current) {
                      storeRef.current.beginTransaction(`typebar:${selected.id}`);
                      propsGestureRef.current = true;
                    }
                    storeRef.current.patchNodeSilent(
                      selected.id,
                      patch as Partial<SceneNode>,
                    );
                    if (isText(selected)) {
                      const stylePatch: Partial<TextStyle> = {};
                      if ('fontSize' in patch && typeof patch.fontSize === 'number')
                        stylePatch.fontSize = patch.fontSize;
                      if ('fontFamily' in patch && typeof patch.fontFamily === 'string')
                        stylePatch.fontFamily = patch.fontFamily;
                      if ('color' in patch && typeof patch.color === 'string')
                        stylePatch.color = patch.color;
                      if ('bold' in patch && typeof patch.bold === 'boolean')
                        stylePatch.bold = patch.bold;
                      if (
                        'align' in patch &&
                        (patch.align === 'left' ||
                          patch.align === 'center' ||
                          patch.align === 'right')
                      )
                        stylePatch.align = patch.align;
                      if (
                        'writingMode' in patch &&
                        (patch.writingMode === 'horizontal' ||
                          patch.writingMode === 'vertical')
                      )
                        stylePatch.writingMode = patch.writingMode;
                      if (Object.keys(stylePatch).length)
                        setTextStyle((s) => mergeTextStyle(s, stylePatch));
                    }
                  }}
                />
                {sceneId === 'xhsNote' && isText(selected) && (
                  <XhsTextCardBar
                    selected={selected}
                    cardType={
                      (frame
                        ? (parseXhsCardTypeFromFrame(frame.name) as XhsCardTypeId | null)
                        : null) ?? null
                    }
                    onBegin={() => {
                      if (!propsGestureRef.current) {
                        storeRef.current.beginTransaction(`xhs-text:${selected.id}`);
                        propsGestureRef.current = true;
                      }
                    }}
                    onEnd={() => {
                      if (propsGestureRef.current) {
                        storeRef.current.commitTransaction();
                        propsGestureRef.current = false;
                      }
                    }}
                    onPatchText={(patch) => {
                      if (!propsGestureRef.current) {
                        storeRef.current.beginTransaction(`xhs-text:${selected.id}`);
                        propsGestureRef.current = true;
                      }
                      storeRef.current.patchNodeSilent(
                        selected.id,
                        patch as Partial<SceneNode>,
                      );
                    }}
                    onApplyStyle={(style: XhsTextCardStyle) => {
                      applyXhsThemeChange(resolveXhsTheme(style.theme));
                      const d = storeRef.current.getDocument();
                      const fr = d ? getActiveFrame(d) : null;
                      const x =
                        style.align === 'center'
                          ? (fr?.width ?? XHS_W) / 2
                          : Math.round((fr?.width ?? XHS_W) * 0.12);
                      storeRef.current.beginTransaction(`xhs-style-text:${selected.id}`);
                      storeRef.current.patchNodeSilent(selected.id, {
                        color: style.textColor,
                        fontFamily: style.fontFamily,
                        fontSize: style.fontSize,
                        align: style.align,
                        bold: style.bold,
                        lineHeight: style.lineHeight,
                        transform: { ...selected.transform, x },
                      } as Partial<SceneNode>);
                      storeRef.current.commitTransaction();
                    }}
                  />
                )}
              </div>
            )}
          {sceneId === 'xhsNote' && (
            <div className="studio-xhs-theme-dock">
              <XhsThemeBar theme={xhsTheme} onChange={applyXhsThemeChange} />
            </div>
          )}
          {imageBarPos && selectedImage && !cropImageId && (
            <ImageContextBar
              screenX={imageBarPos.x}
              screenY={imageBarPos.y}
              placement={imageBarPos.placement}
              mask={selectedImage.mask ?? 'none'}
              onReplaceFile={(f) => void replaceImageFile(selectedImage.id, f)}
              onReplaceLibrary={() => openLibraryReplace(selectedImage.id)}
              onCrop={() => setCropImageId(selectedImage.id)}
              onMask={(mask: ImageMask) => {
                storeRef.current.apply({
                  type: 'patchNode',
                  id: selectedImage.id,
                  patch: {
                    mask,
                    maskRadius:
                      mask === 'roundRect'
                        ? selectedImage.maskRadius ??
                          Math.round(
                            Math.min(selectedImage.width, selectedImage.height) * 0.12,
                          )
                        : selectedImage.maskRadius,
                  },
                });
              }}
              cropDisabled={Math.abs(selectedImage.transform.rotation) > 0.5}
            />
          )}
          {cropOverlay && (
            <StudioCropOverlay
              assetWidth={cropOverlay.assetWidth}
              assetHeight={cropOverlay.assetHeight}
              screenRect={cropOverlay.screenRect}
              onApply={(rect) => applyCrop(cropOverlay.nodeId, rect)}
              onCancel={() => setCropImageId(null)}
            />
          )}
          {marqueeStyle && <div className="studio-marquee" style={marqueeStyle} />}
          <div className="stage-hud glass">
            <span>{status}</span>
            {frame && (
              <span className="muted">
                {`${frame.width}\u00d7${frame.height}`}
              </span>
            )}
          </div>
          {doc && (
            <PageStrip
              pages={doc.pages}
              activePageId={doc.activePageId}
              onSelect={selectPage}
              onAdd={addPage}
              onRename={(pageId, name) => storeRef.current.renamePage(pageId, name)}
              addOptions={
                sceneId === 'xhsNote'
                  ? XHS_CARD_TYPES.map((c) => ({ id: c.id, label: c.label }))
                  : undefined
              }
              onAddOption={sceneId === 'xhsNote' ? addXhsCardPage : undefined}
            />
          )}
          <StudioCanvasChrome
            scale={viewScale}
            onZoomBy={zoomBy}
            onZoomTo={zoomTo}
            onFit={fitView}
            appVersion={APP_VERSION}
          />
        </main>

        <aside className="studio-right glass">
          <header className="panel-header">
            <span>{UI.props}</span>
          </header>
          <PropsPanel
            node={selected ?? null}
            imagePalettes={imagePalettes}
            lockAspect={lockAspect}
            onLockAspectChange={setLockAspect}
            onBeginEdit={() => {
              if (!propsGestureRef.current && selected) {
                storeRef.current.beginTransaction(`props:${selected.id}`);
                propsGestureRef.current = true;
              }
            }}
            onEndEdit={() => {
              if (propsGestureRef.current) {
                storeRef.current.commitTransaction();
                propsGestureRef.current = false;
              }
            }}
            onPatchSilent={(patch) => {
              if (selected) {
                storeRef.current.patchNodeSilent(selected.id, patch as Partial<SceneNode>);
              }
            }}
          />
          <footer className="lab-foot studio-props-foot">
            <span>Del {UI.del}</span>
            <span>Ctrl+D {UI.dup}</span>
            <span>Ctrl+G {UI.group}</span>
            <span>[ ] {UI.layerOrder}</span>
          </footer>
        </aside>
      </div>

      {exportOpen && exportImage && (
        <ExportPanel
          imageData={exportImage}
          onClose={() => {
            setExportOpen(false);
            setExportImage(null);
          }}
        />
      )}
      {batchOpen && exportImage && (
        <BatchExportPanel
          imageData={exportImage}
          onClose={() => {
            setBatchOpen(false);
            setExportImage(null);
          }}
        />
      )}
      {previewPages && (
        <PreviewModal
          pages={previewPages}
          title={
            project
              ? displayProjectTitle(project.name, project.sceneId)
              : undefined
          }
          onClose={() => setPreviewPages(null)}
        />
      )}

      <TemplatePicker
        open={templateOpen}
        onPick={onTemplatePick}
        onCancel={() => setTemplateOpen(false)}
      />

      <LibraryDrawer
        open={libraryOpen}
        mode={libraryMode}
        onClose={() => {
          setLibraryOpen(false);
          setReplaceNodeId(null);
          setLibraryMode('insert');
          setStripKey((k) => k + 1);
        }}
        onPick={(blob, name, id) => void importBlob(blob, name, id)}
        getCurrentImage={() => {
          const d = storeRef.current.getDocument();
          return d ? rendererRef.current.flatten(d) : null;
        }}
        currentLibraryId={libraryIdRef.current}
        onStatus={setStatus}
      />
    </div>
  );
}