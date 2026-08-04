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
import {
  IDB_STORE,
  collectAssets as idbCollectAssets,
  hydrateAssets as idbHydrateAssets,
  idbDelete,
  idbGet,
  idbGetAllKeys,
  idbPut,
} from './idb';

const { templates: TEMPLATES } = IDB_STORE;

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

function idbGetT<T>(key: string): Promise<T | null> {
  return idbGet<T>(TEMPLATES, key);
}

function idbPutT(key: string, value: unknown): Promise<void> {
  return idbPut(TEMPLATES, key, value);
}

function idbDeleteT(key: string): Promise<void> {
  return idbDelete(TEMPLATES, key);
}

function idbGetAllKeysT(): Promise<string[]> {
  return idbGetAllKeys(TEMPLATES);
}

async function collectAssets(
  document: StudioDocument,
  assets: AssetStore,
): Promise<StoredAsset[]> {
  const assetIds = new Set<string>();
  for (const node of Object.values(document.nodes)) {
    if (node.type === 'image') assetIds.add(node.assetId);
  }
  return idbCollectAssets(assetIds, assets);
}

async function hydrateAssetsWithRemap(
  stored: StoredAsset[],
  assets: AssetStore,
): Promise<Map<string, string>> {
  return idbHydrateAssets(stored, assets);
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
  const keys = await idbGetAllKeysT();
  const metas: UserTemplateMeta[] = [];
  for (const key of keys) {
    const t = await idbGetT<UserTemplate>(key);
    if (t) metas.push(toMeta(t));
  }
  metas.sort((a, b) => b.updatedAt - a.updatedAt);
  return metas;
}

export async function getUserTemplate(id: string): Promise<UserTemplate | null> {
  return idbGetT<UserTemplate>(id);
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
  await idbPutT(id, record);
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
  await idbPutT(id, next);
  return toMeta(next);
}

export async function deleteUserTemplate(id: string): Promise<void> {
  await idbDeleteT(id);
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
