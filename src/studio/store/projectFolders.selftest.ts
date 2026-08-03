/**
 * Pure helpers for project VFS — run via smoke when IDB unavailable in Node.
 * Folder CRUD is exercised in the browser home hub.
 */

export function sanitizeFolderNameForTest(name: string): string {
  const trimmed = name.trim().slice(0, 40);
  return trimmed || '\u672a\u547d\u540d\u6587\u4ef6\u5939';
}

export function filterProjectsForFolder(
  projects: Array<{ id: string; folderId: string | null; starred: boolean }>,
  opts: { folderId?: string | null; starredOnly?: boolean },
): string[] {
  return projects
    .filter((p) => {
      if (opts.starredOnly && !p.starred) return false;
      if ('folderId' in opts) {
        const want = opts.folderId ?? null;
        if (p.folderId !== want) return false;
      }
      return true;
    })
    .map((p) => p.id);
}

export function assertProjectFolderFilters(): void {
  const rows = [
    { id: 'a', folderId: null, starred: true },
    { id: 'b', folderId: 'f1', starred: false },
    { id: 'c', folderId: 'f1', starred: true },
  ];
  const root = filterProjectsForFolder(rows, { folderId: null });
  if (root.join(',') !== 'a') throw new Error('root filter failed');
  const inF = filterProjectsForFolder(rows, { folderId: 'f1' });
  if (inF.join(',') !== 'b,c') throw new Error('folder filter failed');
  const starred = filterProjectsForFolder(rows, { starredOnly: true });
  if (starred.join(',') !== 'a,c') throw new Error('starred filter failed');
  if (sanitizeFolderNameForTest('  ') !== '\u672a\u547d\u540d\u6587\u4ef6\u5939') {
    throw new Error('empty folder name fallback failed');
  }
  if (sanitizeFolderNameForTest('  海报  ').length !== 2) {
    throw new Error('folder trim failed');
  }
}
