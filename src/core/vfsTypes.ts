/**
 * Shared virtual-folder shapes (projects now; image library later).
 * Not an OS filesystem — IndexedDB entities + parent pointers.
 */

export type VfsFolder = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export type VfsParent = {
  /** null = root / uncategorized */
  folderId: string | null;
};
