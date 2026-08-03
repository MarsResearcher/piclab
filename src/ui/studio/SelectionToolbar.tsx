import { useEffect, useRef, useState } from 'react';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  FlipHorizontal2,
  FlipVertical2,
  Group,
  Lock,
  LockOpen,
  MoreHorizontal,
  Trash2,
  Ungroup,
} from 'lucide-react';
import type { DocStore } from '../../studio/store';
import type { AlignEdge } from '../../studio/engine';
import { canAlign } from '../../studio/engine';
import { isGroup } from '../../studio/model';
import { IconBtn } from './IconBtn';

type Props = {
  store: DocStore;
  screenX: number;
  screenY: number;
  /** Prefer below the selection when the top type bar occupies that band. */
  placement?: 'above' | 'below';
  onDelete: () => void;
};

export function SelectionToolbar({
  store,
  screenX,
  screenY,
  placement = 'above',
  onDelete,
}: Props) {
  const doc = store.getDocument();
  const [moreOpen, setMoreOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('pointerdown', onDoc, true);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  if (!doc) return null;
  const ids = doc.selection;
  if (ids.length === 0) return null;

  const primary = doc.nodes[ids[0]!];
  const allLocked = ids.every((id) => doc.nodes[id]?.locked);
  const canGroup = ids.length >= 2;
  const canUngroup = ids.length === 1 && !!primary && isGroup(primary);
  const showAlign = ids.some((id) => canAlign(doc.nodes[id]));

  const align = (edge: AlignEdge) => {
    store.apply({ type: 'alignToFrame', ids, edge });
    setMoreOpen(false);
  };

  const setLockedAll = (locked: boolean) => {
    for (const id of ids) store.apply({ type: 'setLocked', id, locked });
  };

  return (
    <div
      ref={rootRef}
      className={`studio-selection-toolbar is-${placement}`}
      style={{ left: screenX, top: screenY }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <IconBtn
        size="sm"
        label={allLocked ? '\u89e3\u9501' : '\u9501\u5b9a'}
        onClick={() => setLockedAll(!allLocked)}
      >
        {allLocked ? <LockOpen size={15} strokeWidth={1.75} /> : <Lock size={15} strokeWidth={1.75} />}
      </IconBtn>
      <IconBtn
        size="sm"
        label={'\u590d\u5236'}
        onClick={() => store.apply({ type: 'duplicateNodes', ids })}
      >
        <Copy size={15} strokeWidth={1.75} />
      </IconBtn>
      <IconBtn size="sm" danger label={'\u5220\u9664'} onClick={onDelete}>
        <Trash2 size={15} strokeWidth={1.75} />
      </IconBtn>
      {canGroup && (
        <IconBtn
          size="sm"
          label={'\u6210\u7ec4'}
          onClick={() => store.apply({ type: 'groupNodes', ids })}
        >
          <Group size={15} strokeWidth={1.75} />
        </IconBtn>
      )}
      {canUngroup && (
        <IconBtn
          size="sm"
          label={'\u89e3\u7ec4'}
          onClick={() => store.apply({ type: 'ungroup', groupId: ids[0]! })}
        >
          <Ungroup size={15} strokeWidth={1.75} />
        </IconBtn>
      )}

      <span className="studio-sel-sep" />

      <div className="studio-sel-more-wrap">
        <IconBtn
          size="sm"
          label={'\u66f4\u591a'}
          active={moreOpen}
          onClick={() => setMoreOpen((o) => !o)}
        >
          <MoreHorizontal size={15} strokeWidth={1.75} />
        </IconBtn>
        {moreOpen && (
          <div className="studio-sel-more glass" role="menu">
            <IconBtn
              size="sm"
              label={'\u6c34\u5e73\u7ffb\u8f6c'}
              onClick={() => {
                store.apply({ type: 'flipNodes', ids, axis: 'h' });
                setMoreOpen(false);
              }}
            >
              <FlipHorizontal2 size={15} strokeWidth={1.75} />
            </IconBtn>
            <IconBtn
              size="sm"
              label={'\u5782\u76f4\u7ffb\u8f6c'}
              onClick={() => {
                store.apply({ type: 'flipNodes', ids, axis: 'v' });
                setMoreOpen(false);
              }}
            >
              <FlipVertical2 size={15} strokeWidth={1.75} />
            </IconBtn>
            <span className="studio-sel-sep" />
            <IconBtn
              size="sm"
              label={'\u7f6e\u9876'}
              onClick={() => {
                store.apply({ type: 'layerOrder', ids, action: 'front' });
                setMoreOpen(false);
              }}
            >
              <ArrowUpToLine size={15} strokeWidth={1.75} />
            </IconBtn>
            <IconBtn
              size="sm"
              label={'\u7f6e\u5e95'}
              onClick={() => {
                store.apply({ type: 'layerOrder', ids, action: 'back' });
                setMoreOpen(false);
              }}
            >
              <ArrowDownToLine size={15} strokeWidth={1.75} />
            </IconBtn>
            {showAlign && (
              <>
                <span className="studio-sel-sep" />
                <IconBtn size="sm" label={'\u5de6\u5bf9\u9f50'} onClick={() => align('left')}>
                  <AlignStartVertical size={15} strokeWidth={1.75} />
                </IconBtn>
                <IconBtn size="sm" label={'\u6c34\u5e73\u5c45\u4e2d'} onClick={() => align('centerX')}>
                  <AlignCenterVertical size={15} strokeWidth={1.75} />
                </IconBtn>
                <IconBtn size="sm" label={'\u53f3\u5bf9\u9f50'} onClick={() => align('right')}>
                  <AlignEndVertical size={15} strokeWidth={1.75} />
                </IconBtn>
                <IconBtn size="sm" label={'\u9876\u5bf9\u9f50'} onClick={() => align('top')}>
                  <AlignStartHorizontal size={15} strokeWidth={1.75} />
                </IconBtn>
                <IconBtn size="sm" label={'\u5782\u76f4\u5c45\u4e2d'} onClick={() => align('centerY')}>
                  <AlignCenterHorizontal size={15} strokeWidth={1.75} />
                </IconBtn>
                <IconBtn size="sm" label={'\u5e95\u5bf9\u9f50'} onClick={() => align('bottom')}>
                  <AlignEndHorizontal size={15} strokeWidth={1.75} />
                </IconBtn>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
