/**
 * L3 user templates — IndexedDB persistence (offline-first, not a cloud marketplace).
 */

import { createId, migrateDocument, type SceneId, type StudioDocument } from '../model';
import { buildBuiltinDocument } from '../templates/builtins';
import { remapDocumentIds } from '../templates/remap';
import type { AssetStore } from './assetStore';
import {
  createProject,
  createProjectFromDocument,
  type BootstrapResult,
  type StoredAsset,
} from './projectStore';

/** Must stay in lockstep with projectStore — same DB name / version. */
const DB_NAME = 'piclab-studio';
const VERSION = 4;
const TEMPLATES = 'templates';
const PROJECTS = 'projects';
const PREFS = 'prefs';
const FOLDERS = 'folders';
const LEGACY_KV = 'kv';

export type UserTemplateMeta = {
  id: string;
  name: string;
  sceneId: SceneId;
  createdAt: number;
  updatedAt: number;
  /** Optional PNG preview as data URL. */
  thumbnail?: string;
};

export type UserTemplate = UserTemplateMeta & {
  document: StudioDocument;
  assets: StoredAsset[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Mirror projectStore upgrade so either module can own the bump.
      if (!db.objectStoreNames.contains(LEGACY_KV)) db.createObjectStore(LEGACY_KV);
      if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS);
      if (!db.objectStoreNames.contains(PREFS)) db.createObjectStore(PREFS);
      if (!db.objectStoreNames.contains(TEMPLATES)) db.createObjectStore(TEMPLATES);
      if (!db.objectStoreNames.contains(FOLDERS)) db.createObjectStore(FOLDERS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(key: string): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(TEMPLATES, 'readonly');
        const req = tx.objectStore(TEMPLATES).get(key);
        req.onsuccess = () => resolve((req.result as T) ?? null);
        req.onerror = () => reject(req.error);
      }),
  );
}

function idbPut(key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(TEMPLATES, 'readwrite');
        tx.objectStore(TEMPLATES).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function idbDelete(key: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(TEMPLATES, 'readwrite');
        tx.objectStore(TEMPLATES).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function idbGetAllKeys(): Promise<string[]> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(TEMPLATES, 'readonly');
        const req = tx.objectStore(TEMPLATES).getAllKeys();
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

async function hydrateAssetsWithRemap(
  stored: StoredAsset[],
  assets: AssetStore,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const a of stored) {
    const imageData = await blobToImageData(a.blob);
    const asset = assets.putImageData(imageData);
    map.set(a.id, asset.id);
  }
  return map;
}

function toMeta(t: UserTemplate): UserTemplateMeta {
  return {
    id: t.id,
    name: t.name,
    sceneId: t.sceneId,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    thumbnail: t.thumbnail,
  };
}

export async function listUserTemplates(): Promise<UserTemplateMeta[]> {
  const keys = await idbGetAllKeys();
  const metas: UserTemplateMeta[] = [];
  for (const key of keys) {
    const t = await idbGet<UserTemplate>(key);
    if (t) metas.push(toMeta(t));
  }
  metas.sort((a, b) => b.updatedAt - a.updatedAt);
  return metas;
}

export async function getUserTemplate(id: string): Promise<UserTemplate | null> {
  return idbGet<UserTemplate>(id);
}

export async function saveUserTemplate(
  name: string,
  document: StudioDocument,
  assets: AssetStore,
  opts?: { thumbnail?: string },
): Promise<UserTemplateMeta> {
  const trimmed = name.trim() || document.name || '未命名模板';
  const sceneId = (document.sceneId ?? 'card') as SceneId;
  const now = Date.now();
  const id = createId('tpl');
  const snapshot = structuredClone(document);
  snapshot.name = trimmed;

  const record: UserTemplate = {
    id,
    name: trimmed,
    sceneId,
    document: snapshot,
    assets: await collectAssets(snapshot, assets),
    createdAt: now,
    updatedAt: now,
    thumbnail: opts?.thumbnail,
  };
  await idbPut(id, record);
  return toMeta(record);
}

export async function renameUserTemplate(
  id: string,
  name: string,
): Promise<UserTemplateMeta | null> {
  const existing = await getUserTemplate(id);
  if (!existing) return null;
  const trimmed = name.trim() || existing.name;
  const next: UserTemplate = {
    ...existing,
    name: trimmed,
    document: { ...existing.document, name: trimmed },
    updatedAt: Date.now(),
  };
  await idbPut(id, next);
  return toMeta(next);
}

export async function deleteUserTemplate(id: string): Promise<void> {
  await idbDelete(id);
}

/** Instantiate L3 user template as a new project (remapped ids + cloned asset blobs). */
export async function createProjectFromUserTemplate(
  templateId: string,
  assets: AssetStore,
  opts?: { name?: string },
): Promise<BootstrapResult | null> {
  const template = await getUserTemplate(templateId);
  if (!template) return null;

  assets.clear();
  const assetIdMap = await hydrateAssetsWithRemap(template.assets, assets);
  const document = remapDocumentIds(migrateDocument(template.document), assetIdMap);
  return createProjectFromDocument(template.sceneId, document, assets, {
    name: opts?.name ?? template.name,
  });
}

/** Instantiate L1 builtin template as a new project. */
export async function createProjectFromBuiltinTemplate(
  templateId: string,
  assets: AssetStore,
  opts?: { name?: string },
): Promise<BootstrapResult | null> {
  assets.clear();
  const document = await buildBuiltinDocument(templateId, { assets });
  if (!document) return null;
  const remapped = remapDocumentIds(document);
  const sceneId = remapped.sceneId ?? 'card';
  return createProjectFromDocument(sceneId, remapped, assets, {
    name: opts?.name ?? document.name,
  });
}

/** L2 parametric scene — thin wrapper over createProject. */
export async function createProjectFromScene(
  sceneId: SceneId,
  assets: AssetStore,
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
): Promise<BootstrapResult> {
  return createProject(sceneId, assets, opts);
}

export async function blobToThumbnailDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
