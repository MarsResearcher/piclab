import { useCallback, useEffect, useState, type RefObject } from 'react';
import {
  AssetStore,
  DocStore,
  StudioRenderer,
  getScene,
  bootstrapProjects,
  bindProjectFlushLifecycle,
  createProjectFromBuiltinTemplate,
  createProjectFromScene,
  createProjectFromUserTemplate,
  deleteProject,
  flushProjectSave,
  listProjects,
  openProject,
  renameProject,
  saveUserTemplate,
  blobToThumbnailDataUrl,
  subscribeSaveStatus,
  type BootstrapResult,
  type ProjectMeta,
  type SaveStatus,
  type SceneId,
  type TemplatePick,
} from '../../../studio';
import { ensureSampleInLibrary } from '../../../core/library';
import type { PreviewPage } from '../PreviewModal';
import { STATUS } from '../uiLabels';

export type UseStudioProjectSessionOptions = {
  landing: 'home' | 'editor';
  onLandingChange?: (landing: 'home' | 'editor') => void;
  storeRef: RefObject<DocStore>;
  assetsRef: RefObject<AssetStore>;
  rendererRef: RefObject<StudioRenderer>;
  fittedOnceRef: React.MutableRefObject<boolean>;
  fitView: () => void;
  setEditingId: (id: string | null) => void;
  setExportOpen: (open: boolean) => void;
  setBatchOpen: (open: boolean) => void;
  setExportImage: (image: ImageData | null) => void;
  setPreviewPages: React.Dispatch<React.SetStateAction<PreviewPage[] | null>>;
  setStatus: (status: string) => void;
  onStripRefresh?: () => void;
};

export function useStudioProjectSession({
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
  onStripRefresh,
}: UseStudioProjectSessionOptions) {
  const [sceneId, setSceneId] = useState<SceneId>('card');
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [projectListOpen, setProjectListOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [screen, setScreen] = useState<'home' | 'editor'>(landing);
  const [ready, setReady] = useState(false);

  useEffect(
    () =>
      subscribeSaveStatus((s, updatedAt) => {
        setSaveStatus(s);
        if (s === 'saved' && updatedAt != null) {
          setProject((prev) => (prev ? { ...prev, updatedAt } : prev));
        }
      }),
    [],
  );

  useEffect(() => {
    return bindProjectFlushLifecycle(
      () => storeRef.current!.getDocument(),
      () => assetsRef.current!,
    );
  }, [assetsRef, storeRef]);

  const refreshProjectList = useCallback(async () => {
    setProjects(await listProjects());
  }, []);

  const enterEditor = useCallback(() => {
    setScreen('editor');
    onLandingChange?.('editor');
  }, [onLandingChange]);

  const applyBootstrap = useCallback(
    (result: BootstrapResult, statusText?: string) => {
      storeRef.current!.load(result.document);
      setProject(result.project);
      setSceneId(result.project.sceneId);
      setEditingId(null);
      setExportOpen(false);
      setBatchOpen(false);
      setExportImage(null);
      setPreviewPages(null);
      setTemplateOpen(false);
      const scene = getScene(result.project.sceneId);
      setStatus(statusText ?? `\u5df2\u6253\u5f00 \u00b7 ${scene?.label ?? '\u9879\u76ee'}`);
      fittedOnceRef.current = false;
      requestAnimationFrame(() => {
        fitView();
        fittedOnceRef.current = true;
      });
      void refreshProjectList();
      enterEditor();
    },
    [
      enterEditor,
      fitView,
      fittedOnceRef,
      refreshProjectList,
      setBatchOpen,
      setEditingId,
      setExportImage,
      setExportOpen,
      setPreviewPages,
      setStatus,
      storeRef,
    ],
  );

  const onNewProject = useCallback(() => {
    setProjectListOpen(false);
    setTemplateOpen(true);
  }, []);

  const onTemplatePick = useCallback(
    (
      pick: TemplatePick,
      opts?: {
        fromImage?: ImageData;
        name?: string;
        rows?: number;
        cols?: number;
        pageCount?: number;
        marginMm?: number;
        gridStyle?: 'shuge' | 'mizi';
        xhsCardType?: string;
        xhsTheme?: {
          skin?: string;
          palette?: string;
          bg?: string;
          typeScale?: string;
        };
      },
    ) => {
      void (async () => {
        let result: BootstrapResult | null = null;
        switch (pick.layer) {
          case 'parametric':
            result = await createProjectFromScene(pick.sceneId, assetsRef.current!, {
              ...opts,
              xhsCardType: opts?.xhsCardType ?? pick.xhsCardType,
              xhsTheme: opts?.xhsTheme ?? pick.xhsTheme,
            });
            break;
          case 'builtin':
            result = await createProjectFromBuiltinTemplate(
              pick.templateId,
              assetsRef.current!,
            );
            break;
          case 'user':
            result = await createProjectFromUserTemplate(
              pick.templateId,
              assetsRef.current!,
            );
            break;
          default: {
            const _exhaustive: never = pick;
            void _exhaustive;
          }
        }
        if (!result) return;
        applyBootstrap(result, `\u65b0\u5efa \u00b7 ${result.project.name}`);
      })();
    },
    [applyBootstrap, assetsRef],
  );

  const onOpenProjectFromHome = useCallback(
    (id: string) => {
      void (async () => {
        const result = await openProject(id, assetsRef.current!);
        if (!result) return;
        applyBootstrap(result, `\u5df2\u6253\u5f00 \u00b7 ${result.project.name}`);
      })();
    },
    [applyBootstrap, assetsRef],
  );

  const onContinueFromHome = useCallback(() => {
    void (async () => {
      const result = await bootstrapProjects(assetsRef.current!);
      applyBootstrap(result, `\u5df2\u6062\u590d \u00b7 ${result.project.name}`);
    })();
  }, [applyBootstrap, assetsRef]);

  const onGoHome = useCallback(() => {
    void (async () => {
      await flushProjectSave();
      setScreen('home');
      onLandingChange?.('home');
      setProjectListOpen(false);
      setTemplateOpen(false);
    })();
  }, [onLandingChange]);

  const onSaveAsTemplate = useCallback(() => {
    const doc = storeRef.current!.getDocument();
    if (!doc) return;
    const defaultName = doc.name ?? project?.name ?? '我的模板';
    const name = window.prompt('另存为模板（保存在本机 IndexedDB）', defaultName);
    if (name === null) return;
    void (async () => {
      await flushProjectSave();
      let thumbnail: string | undefined;
      const flat = rendererRef.current!.flatten(doc);
      if (flat) {
        const maxW = 240;
        const scale = Math.min(1, maxW / flat.width);
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(flat.width * scale));
        c.height = Math.max(1, Math.round(flat.height * scale));
        const ctx = c.getContext('2d')!;
        const src = document.createElement('canvas');
        src.width = flat.width;
        src.height = flat.height;
        src.getContext('2d')!.putImageData(flat, 0, 0);
        ctx.drawImage(src, 0, 0, c.width, c.height);
        const blob = await new Promise<Blob | null>((resolve) => {
          c.toBlob((b) => resolve(b), 'image/png');
        });
        if (blob) thumbnail = await blobToThumbnailDataUrl(blob);
      }
      await saveUserTemplate(name, doc, assetsRef.current!, { thumbnail });
      setStatus(STATUS.templateSaved(name.trim() || defaultName));
    })();
  }, [assetsRef, project?.name, rendererRef, setStatus, storeRef]);

  const onOpenProject = useCallback(
    (id: string) => {
      void (async () => {
        const result = await openProject(id, assetsRef.current!);
        if (!result) return;
        applyBootstrap(result, `\u5df2\u6253\u5f00 \u00b7 ${result.project.name}`);
        setProjectListOpen(false);
      })();
    },
    [applyBootstrap, assetsRef],
  );

  const onRenameProject = useCallback(() => {
    if (!project) return;
    const seed =
      !project.name.trim() || /^[?\uFFFD\s._-]+$/.test(project.name.trim())
        ? ''
        : project.name;
    const next = window.prompt('\u91cd\u547d\u540d\u9879\u76ee', seed);
    if (next === null) return;
    void (async () => {
      const meta = await renameProject(project.id, next);
      if (!meta) return;
      setProject(meta);
      const doc = storeRef.current!.getDocument();
      if (doc) storeRef.current!.load({ ...doc, name: meta.name });
      setStatus(`\u5df2\u91cd\u547d\u540d \u00b7 ${meta.name}`);
      void refreshProjectList();
    })();
  }, [project, refreshProjectList, setStatus, storeRef]);

  const onDeleteProject = useCallback(() => {
    if (!project) return;
    if (
      !window.confirm(
        `\u5220\u9664\u9879\u76ee\u300c${project.name}\u300d\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500\u3002`,
      )
    )
      return;
    void (async () => {
      const result = await deleteProject(project.id, assetsRef.current!, sceneId);
      if (result) applyBootstrap(result, `\u5df2\u5220\u9664 \u00b7 ${result.project.name}`);
      else {
        setProject(null);
        void refreshProjectList();
      }
    })();
  }, [applyBootstrap, assetsRef, project, refreshProjectList, sceneId]);

  useEffect(() => {
    if (landing === 'home') {
      setScreen('home');
      setReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      await ensureSampleInLibrary();
      onStripRefresh?.();
      const result = await bootstrapProjects(assetsRef.current!);
      if (cancelled) return;
      applyBootstrap(result, `\u5df2\u6062\u590d \u00b7 ${result.project.name}`);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landing]);

  return {
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
  };
}
