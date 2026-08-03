import { LibraryPanel } from './LibraryPanel';

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (blob: Blob, name: string, id: string) => void;
  getCurrentImage: () => ImageData | null;
  currentLibraryId: string | null;
  mode?: 'insert' | 'replace';
  onStatus?: (msg: string) => void;
};

export function LibraryDrawer({
  open,
  onClose,
  onPick,
  getCurrentImage,
  currentLibraryId,
  mode = 'insert',
  onStatus,
}: Props) {
  if (!open) return null;

  return (
    <div className="library-drawer-root">
      <button type="button" className="library-backdrop" aria-label="关闭图库" onClick={onClose} />
      <aside className="library-drawer glass">
        <header className="library-drawer-head">
          <span>{mode === 'replace' ? '替换图片 · 图库' : '图片库'}</span>
          <button type="button" className="close" onClick={onClose}>
            ×
          </button>
        </header>
        <LibraryPanel
          onPick={(blob, name, id) => {
            onPick(blob, name, id);
            onClose();
          }}
          getCurrentImage={getCurrentImage}
          currentLibraryId={currentLibraryId}
          onStatus={onStatus}
        />
      </aside>
    </div>
  );
}
