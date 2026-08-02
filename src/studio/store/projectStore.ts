/**
 * Multi-project persistence (PPT-like): autosave, per-scene last project, open/new.
 */

import { createId, migrateDocument, type SceneId, type StudioDocument } from '../model';
import { getScene } from '../plugins/host';
import type { SceneCreateOptions } from '../plugins/types';
import type { VfsFolder } from '../../core/vfsTypes';
import type { AssetStore } from './assetStore';

const DB_NAME = 'piclab-studio';
const VERSION = 4;
const PROJECTS = 'projects';
const TEMPLATES = 'templates';
const FOLDERS = 'folders';
const PREFS = 'prefs';
const LEGACY_KV = 'kv';
const LEGACY_KEY = 'studio-doc';
const PREFS_KEY = 'prefs';

type StoredAsset = {
  id: string;
  width: number;
  height: number;
  blob: Blob;
};

export type { StoredAsset };

export type ProjectFolder = VfsFolder;

export type StudioProject = {
  id: string;
  name: string;
  sceneId: SceneId;
  document: StudioDocument;
  assets: StoredAsset[];
  createdAt: number;
  updatedAt: number;
  /** null = root / uncategorized */
  folderId: string | null;
  starred: boolean;
};

export type ProjectMeta = {
  id: string;
  name: string;
  sceneId: SceneId;
  createdAt: number;
  updatedAt: number;
  folderId: string | null;
  starred: boolean;
};

export type ListProjectsOpts = {
  /** Omit = all; `null` = root only; string = that folder */
  folderId?: string | null;
  starredOnly?: boolean;
};

export type ProjectPrefs = {
  activeProjectId: string | null;
  lastByScene: Partial<Record<SceneId, string>>;
};

/** Legacy single-slot snapshot (v1). */
type LegacySessionSnapshot = {
  document: StudioDocument;
  assets: StoredAsset[];
  savedAt: number;
};

export type BootstrapResult = {
  document: StudioDocument;
  project: ProjectMeta;
};

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

type SaveListener = (status: SaveStatus, updatedAt: number | null) => void;

let saveTimer: number | null = null;
let pendingDoc: StudioDocument | null = null;
let pendingAssets: AssetStore | null = null;
let saveStatus: SaveStatus = 'idle';
let lastSavedAt: number | null = null;
const saveListeners = new Set<SaveListener>();

function notifySave(status: SaveStatus, updatedAt: number | null = lastSavedAt): void {
  saveStatus = status;
  if (updatedAt !== null) lastSavedAt = updatedAt;
  for (const fn of saveListeners) fn(saveStatus, lastSavedAt);
}

export function subscribeSaveStatus(fn: SaveListener): () => void {
  saveListeners.add(fn);
  fn(saveStatus, lastSavedAt);
  return () => {
    saveListeners.delete(fn);
  };
}

export function getSaveStatus(): { status: SaveStatus; updatedAt: number | null } {
  return { status: saveStatus, updatedAt: lastSavedAt };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LEGACY_KV)) {
        db.createObjectStore(LEGACY_KV);
      }
      if (!db.objectStoreNames.contains(PROJECTS)) {
        db.createObjectStore(PROJECTS);
      }
      if (!db.objectStoreNames.contains(PREFS)) {
        db.createObjectStore(PREFS);
      }
      if (!db.objectStoreNames.contains(TEMPLATES)) {
        db.createObjectStore(TEMPLATES);
      }
      if (!db.objectStoreNames.contains(FOLDERS)) {
        db.createObjectStore(FOLDERS);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(store: string, key: string): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve((req.result as T) ?? null);
        req.onerror = () => reject(req.error);
      }),
  );
}

function idbPut(store: string, key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function idbDelete(store: string, key: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function idbGetAllKeys(store: string): Promise<string[]> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).getAllKeys();
        req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String));
        req.onerror = () => reject(req.error);
      }),
  );
}

function imageDataToPngBlob(imageData: ImageData): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = imageData.width;
  c.height = imageData.height;
  c.getContext('2d')!.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    c.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG encode failed'));
    }, 'image/png');
  });
}

async function blobToImageData(blob: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob);
  const c = document.createElement('canvas');
  c.width = bitmap.width;
  c.height = bitmap.height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}

async function collectAssets(
  document: StudioDocument,
  assets: AssetStore,
): Promise<StoredAsset[]> {
  const assetIds = new Set<string>();
  for (const node of Object.values(document.nodes)) {
    if (node.type === 'image') assetIds.add(node.assetId);
  }
  const stored: StoredAsset[] = [];
  for (const id of assetIds) {
    const asset = assets.get(id);
    if (!asset) continue;
    stored.push({
      id: asset.id,
      width: asset.width,
      height: asset.height,
      blob: await imageDataToPngBlob(asset.imageData),
    });
  }
  return stored;
}

async function hydrateAssets(project: StudioProject, assets: AssetStore): Promise<void> {
  assets.clear();
  for (const a of project.assets) {
    const imageData = await blobToImageData(a.blob);
    assets.putImageData(imageData, a.id);
  }
}

function defaultProjectName(sceneId: SceneId): string {
  const scene = getScene(sceneId);
  return scene?.label ?? sceneId;
}

function normalizeProject(p: StudioProject): StudioProject {
  return {
    ...p,
    folderId: p.folderId ?? null,
    starred: Boolean(p.starred),
  };
}

function toMeta(p: StudioProject): ProjectMeta {
  const n = normalizeProject(p);
  return {
    id: n.id,
    name: n.name,
    sceneId: n.sceneId,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    folderId: n.folderId,
    starred: n.starred,
  };
}

async function readPrefs(): Promise<ProjectPrefs> {
  const prefs = await idbGet<ProjectPrefs>(PREFS, PREFS_KEY);
  return prefs ?? { activeProjectId: null, lastByScene: {} };
}

async function writePrefs(prefs: ProjectPrefs): Promise<void> {
  await idbPut(PREFS, PREFS_KEY, prefs);
}

async function getProject(id: string): Promise<StudioProject | null> {
  const p = await idbGet<StudioProject>(PROJECTS, id);
  return p ? normalizeProject(p) : null;
}

async function putProject(project: StudioProject): Promise<void> {
  await idbPut(PROJECTS, project.id, normalizeProject(project));
}

async function migrateLegacyIfNeeded(): Promise<void> {
  const keys = await idbGetAllKeys(PROJECTS);
  if (keys.length > 0) return;

  const legacy = await idbGet<LegacySessionSnapshot>(LEGACY_KV, LEGACY_KEY);
  if (!legacy?.document) return;

  const now = Date.now();
  const sceneId = (legacy.document.sceneId ?? 'card') as SceneId;
  const id = createId('proj');
  const project: StudioProject = {
    id,
    name: legacy.document.name || defaultProjectName(sceneId),
    sceneId,
    document: { ...legacy.document, sceneId },
    assets: legacy.assets ?? [],
    createdAt: legacy.savedAt ?? now,
    updatedAt: legacy.savedAt ?? now,
    folderId: null,
    starred: false,
  };
  await putProject(project);
  await writePrefs({
    activeProjectId: id,
    lastByScene: { [sceneId]: id },
  });
  await idbDelete(LEGACY_KV, LEGACY_KEY);
}

export async function listProjects(opts?: ListProjectsOpts): Promise<ProjectMeta[]> {
  await migrateLegacyIfNeeded();
  const keys = await idbGetAllKeys(PROJECTS);
  const metas: ProjectMeta[] = [];
  for (const key of keys) {
    const p = await getProject(key);
    if (!p) continue;
    const meta = toMeta(p);
    if (opts?.starredOnly && !meta.starred) continue;
    if (opts && 'folderId' in opts) {
      const want = opts.folderId ?? null;
      if (meta.folderId !== want) continue;
    }
    metas.push(meta);
  }
  metas.sort((a, b) => b.updatedAt - a.updatedAt);
  return metas;
}

export async function getActiveProjectMeta(): Promise<ProjectMeta | null> {
  const prefs = await readPrefs();
  if (!prefs.activeProjectId) return null;
  const p = await getProject(prefs.activeProjectId);
  return p ? toMeta(p) : null;
}

async function applyProject(
  project: StudioProject,
  assets: AssetStore,
): Promise<BootstrapResult> {
  await hydrateAssets(project, assets);
  const prefs = await readPrefs();
  prefs.activeProjectId = project.id;
  prefs.lastByScene[project.sceneId] = project.id;
  await writePrefs(prefs);
  lastSavedAt = project.updatedAt;
  notifySave('saved', project.updatedAt);
  return {
    document: migrateDocument(project.document),
    project: toMeta(project),
  };
}

export async function openProject(
  id: string,
  assets: AssetStore,
): Promise<BootstrapResult | null> {
  await flushProjectSave();
  const project = await getProject(id);
  if (!project) return null;
  return applyProject(project, assets);
}

export async function createProject(
  sceneId: SceneId,
  assets: AssetStore,
  opts?: Pick<
    SceneCreateOptions,
    | 'fromImage'
    | 'rows'
    | 'cols'
    | 'pageCount'
    | 'marginMm'
    | 'gridStyle'
    | 'xhsCardType'
    | 'xhsTheme'
  > & {
    name?: string;
  },
): Promise<BootstrapResult> {
  await flushProjectSave();
  const scene = getScene(sceneId);
  if (!scene) throw new Error(`Unknown scene: ${sceneId}`);

  assets.clear();
  const document = scene.createDocument({
    fromImage: opts?.fromImage,
    assets,
    rows: opts?.rows,
    cols: opts?.cols,
    pageCount: opts?.pageCount,
    marginMm: opts?.marginMm,
    gridStyle: opts?.gridStyle,
    xhsCardType: opts?.xhsCardType,
    xhsTheme: opts?.xhsTheme,
  });
  document.sceneId = sceneId;
  const now = Date.now();
  const id = createId('proj');
  const name = opts?.name ?? defaultProjectName(sceneId);
  document.name = name;

  const project: StudioProject = {
    id,
    name,
    sceneId,
    document,
    assets: await collectAssets(document, assets),
    createdAt: now,
    updatedAt: now,
    folderId: null,
    starred: false,
  };
  await putProject(project);
  return applyProject(project, assets);
}

export async function createProjectFromDocument(
  sceneId: SceneId,
  document: StudioDocument,
  assets: AssetStore,
  opts?: { name?: string },
): Promise<BootstrapResult> {
  await flushProjectSave();
  const now = Date.now();
  const id = createId('proj');
  const name = opts?.name ?? document.name ?? defaultProjectName(sceneId);
  const doc: StudioDocument = {
    ...document,
    name,
    sceneId,
  };
  const project: StudioProject = {
    id,
    name,
    sceneId,
    document: doc,
    assets: await collectAssets(doc, assets),
    createdAt: now,
    updatedAt: now,
    folderId: null,
    starred: false,
  };
  await putProject(project);
  return applyProject(project, assets);
}

export async function saveActiveProject(
  document: StudioDocument | null,
  assets: AssetStore,
): Promise<void> {
  if (!document) return;
  const prefs = await readPrefs();
  let projectId = prefs.activeProjectId;
  let existing = projectId ? await getProject(projectId) : null;

  if (!existing) {
    const sceneId = (document.sceneId ?? 'card') as SceneId;
    const now = Date.now();
    projectId = createId('proj');
    existing = {
      id: projectId,
      name: document.name || defaultProjectName(sceneId),
      sceneId,
      document,
      assets: [],
      createdAt: now,
      updatedAt: now,
      folderId: null,
      starred: false,
    };
  }

  const sceneId = (document.sceneId ?? existing.sceneId) as SceneId;
  const now = Date.now();
  const name = document.name?.trim() || existing.name;
  const next: StudioProject = {
    ...normalizeProject(existing),
    name,
    sceneId,
    document: { ...document, name, sceneId },
    assets: await collectAssets(document, assets),
    updatedAt: now,
  };
  await putProject(next);
  prefs.activeProjectId = next.id;
  prefs.lastByScene[sceneId] = next.id;
  await writePrefs(prefs);
  notifySave('saved', now);
}

export function scheduleProjectSave(
  document: StudioDocument | null,
  assets: AssetStore,
): void {
  pendingDoc = document;
  pendingAssets = assets;
  notifySave('pending', lastSavedAt);
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    void flushProjectSave();
  }, 700);
}

export async function flushProjectSave(): Promise<void> {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
  }
  const doc = pendingDoc;
  const assets = pendingAssets;
  if (!doc || !assets) {
    if (saveStatus === 'pending') notifySave('saved', lastSavedAt);
    return;
  }
  pendingDoc = null;
  pendingAssets = null;
  notifySave('saving', lastSavedAt);
  try {
    await saveActiveProject(doc, assets);
  } catch {
    notifySave('error', lastSavedAt);
  }
}

export async function switchScene(
  sceneId: SceneId,
  assets: AssetStore,
): Promise<BootstrapResult> {
  await flushProjectSave();
  const prefs = await readPrefs();
  const lastId = prefs.lastByScene[sceneId];
  if (lastId) {
    const existing = await getProject(lastId);
    if (existing) return applyProject(existing, assets);
  }
  return createProject(sceneId, assets);
}

function sanitizeProjectName(name: string, fallback: string): string {
  const trimmed = name.trim();
  if (!trimmed || /^[?\uFFFD\s._-]+$/.test(trimmed)) return fallback;
  return trimmed.slice(0, 80);
}

export async function renameProject(id: string, name: string): Promise<ProjectMeta | null> {
  const project = await getProject(id);
  if (!project) return null;
  const trimmed = sanitizeProjectName(name, project.name || defaultProjectName(project.sceneId));
  project.name = trimmed;
  project.document = { ...project.document, name: trimmed };
  project.updatedAt = Date.now();
  await putProject(project);
  notifySave('saved', project.updatedAt);
  return toMeta(project);
}

/** Remove a project from the library (home hub). Does not create a replacement. */
export async function removeProject(id: string): Promise<void> {
  await flushProjectSave();
  const prefs = await readPrefs();
  await idbDelete(PROJECTS, id);
  for (const [scene, pid] of Object.entries(prefs.lastByScene)) {
    if (pid === id) delete prefs.lastByScene[scene as SceneId];
  }
  if (prefs.activeProjectId === id) prefs.activeProjectId = null;
  await writePrefs(prefs);
}

export async function deleteProject(
  id: string,
  assets: AssetStore,
  fallbackSceneId: SceneId = 'card',
): Promise<BootstrapResult | null> {
  await removeProject(id);
  const prefs = await readPrefs();
  if (prefs.activeProjectId) return null;
  const remaining = await listProjects();
  if (remaining[0]) {
    return openProject(remaining[0].id, assets);
  }
  return createProject(fallbackSceneId, assets);
}

export async function bootstrapProjects(assets: AssetStore): Promise<BootstrapResult> {
  await migrateLegacyIfNeeded();
  const prefs = await readPrefs();
  if (prefs.activeProjectId) {
    const active = await getProject(prefs.activeProjectId);
    if (active) return applyProject(active, assets);
  }
  const listed = await listProjects();
  if (listed[0]) {
    const opened = await openProject(listed[0].id, assets);
    if (opened) return opened;
  }
  return createProject('card', assets);
}

function sanitizeFolderName(name: string): string {
  const trimmed = name.trim().slice(0, 40);
  return trimmed || '\u672a\u547d\u540d\u6587\u4ef6\u5939';
}

export async function listFolders(): Promise<ProjectFolder[]> {
  await migrateLegacyIfNeeded();
  const keys = await idbGetAllKeys(FOLDERS);
  const out: ProjectFolder[] = [];
  for (const key of keys) {
    const f = await idbGet<ProjectFolder>(FOLDERS, key);
    if (f) out.push(f);
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'zh') || b.updatedAt - a.updatedAt);
  return out;
}

export async function createFolder(name: string): Promise<ProjectFolder> {
  const now = Date.now();
  const folder: ProjectFolder = {
    id: createId('folder'),
    name: sanitizeFolderName(name),
    createdAt: now,
    updatedAt: now,
  };
  await idbPut(FOLDERS, folder.id, folder);
  return folder;
}

export async function renameFolder(
  id: string,
  name: string,
): Promise<ProjectFolder | null> {
  const folder = await idbGet<ProjectFolder>(FOLDERS, id);
  if (!folder) return null;
  folder.name = sanitizeFolderName(name);
  folder.updatedAt = Date.now();
  await idbPut(FOLDERS, folder.id, folder);
  return folder;
}

/** Delete folder; projects in it return to root (not deleted). */
export async function deleteFolder(id: string): Promise<void> {
  const keys = await idbGetAllKeys(PROJECTS);
  for (const key of keys) {
    const p = await getProject(key);
    if (!p || p.folderId !== id) continue;
    p.folderId = null;
    p.updatedAt = Date.now();
    await putProject(p);
  }
  await idbDelete(FOLDERS, id);
}

export async function moveProjectToFolder(
  projectId: string,
  folderId: string | null,
): Promise<ProjectMeta | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  if (folderId) {
    const folder = await idbGet<ProjectFolder>(FOLDERS, folderId);
    if (!folder) return null;
  }
  project.folderId = folderId;
  project.updatedAt = Date.now();
  await putProject(project);
  return toMeta(project);
}

export async function setProjectStarred(
  projectId: string,
  starred: boolean,
): Promise<ProjectMeta | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  project.starred = starred;
  project.updatedAt = Date.now();
  await putProject(project);
  return toMeta(project);
}

/** Bind flush on tab hide / unload so mid-edit work is not lost. */
export function bindProjectFlushLifecycle(
  getDoc: () => StudioDocument | null,
  getAssets: () => AssetStore,
): () => void {
  const flush = () => {
    const doc = getDoc();
    if (doc) {
      pendingDoc = doc;
      pendingAssets = getAssets();
    }
    void flushProjectSave();
  };
  const onVis = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', onVis);
  return () => {
    window.removeEventListener('pagehide', flush);
    window.removeEventListener('beforeunload', flush);
    document.removeEventListener('visibilitychange', onVis);
  };
}
