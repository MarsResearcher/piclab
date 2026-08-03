import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Page } from '../../studio';

export type PageStripAddOption = { id: string; label: string };

type Props = {
  pages: Page[];
  activePageId: string;
  onSelect: (pageId: string) => void;
  /** Blank page (used when no addOptions, or as fallback). */
  onAdd: () => void;
  onRename?: (pageId: string, name: string) => void;
  /** When set, + opens a menu of structured page types. */
  addOptions?: PageStripAddOption[];
  onAddOption?: (id: string) => void;
};

export function PageStrip({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onRename,
  addOptions,
  onAddOption,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const hasMenu = Boolean(addOptions?.length && onAddOption);

  return (
    <div className="page-strip glass" role="tablist" aria-label="画板">
      <div className="page-strip-pages">
        {pages.map((page, index) => {
          const active = page.id === activePageId;
          return (
            <button
              key={page.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`page-strip-tab ${active ? 'active' : ''}`}
              onClick={() => onSelect(page.id)}
              onDoubleClick={() => {
                if (!onRename) return;
                const next = window.prompt('\u753b\u677f\u540d\u79f0', page.name);
                if (next != null) onRename(page.id, next);
              }}
              title={page.name}
            >
              <span className="page-strip-index">{index + 1}</span>
              <span className="page-strip-name">{page.name}</span>
            </button>
          );
        })}
      </div>
      <div className="page-strip-add-wrap" ref={wrapRef}>
        <button
          type="button"
          className="btn icon page-strip-add"
          title={hasMenu ? '\u6309\u7c7b\u578b\u6dfb\u52a0\u753b\u677f' : '\u6dfb\u52a0\u753b\u677f'}
          onClick={() => {
            if (hasMenu) setMenuOpen((o) => !o);
            else onAdd();
          }}
        >
          <Plus size={14} />
        </button>
        {hasMenu && menuOpen && (
          <div className="page-strip-add-menu glass" role="menu">
            {addOptions!.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="menuitem"
                className="page-strip-add-item"
                onClick={() => {
                  onAddOption!(opt.id);
                  setMenuOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              className="page-strip-add-item is-muted"
              onClick={() => {
                onAdd();
                setMenuOpen(false);
              }}
            >
              {'\u7a7a\u767d\u9875'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
