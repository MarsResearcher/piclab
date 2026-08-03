import { listScenes, type SceneId } from '../../studio';

export function sceneLabel(id: SceneId | string): string {
  return listScenes().find((s) => s.id === id)?.label ?? String(id);
}

/** Empty / ? / replacement-char junk. */
export function isWeakProjectName(name: string | undefined): boolean {
  const n = name?.trim() ?? '';
  if (!n) return true;
  if (/^[?\uFFFD\s._-]+$/.test(n)) return true;
  if (/^[\x00-\x1f]+$/.test(n)) return true;
  return false;
}

/**
 * Card / topbar title. Strips auto-stamp "场景 · M/D HH:mm" so recent cards
 * don't repeat the same line as the updated-at meta.
 */
export function displayProjectTitle(
  name: string | undefined,
  sceneId: SceneId | string | undefined,
): string {
  const label = sceneId ? sceneLabel(sceneId) : '\u2014';
  if (isWeakProjectName(name)) return label;
  const n = name!.trim();
  const stamped = /^(.+?)\s*[·•]\s*\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}$/.exec(n);
  if (stamped) {
    const head = stamped[1]!.trim();
    return head || label;
  }
  return n;
}

export function formatProjectWhen(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const md = `${d.getMonth() + 1}/${d.getDate()}`;
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (sameYear) return `${md} ${hm}`;
  return `${d.getFullYear()}/${md} ${hm}`;
}

/** Dimensions like 1080×1920 — always a real multiply sign. */
export function formatDims(width: number, height: number): string {
  return `${width}\u00d7${height}`;
}
