import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  Folder,
  Frame,
  GripVertical,
  Image as ImageIcon,
  Lock,
  LockOpen,
  Minus,
  Paintbrush,
  Square,
  Squircle,
  Star,
  Trash2,
  Triangle,
  Type,
} from 'lucide-react';
import {
  getActiveFrame,
  isFrame,
  isGroup,
  isImage,
  isInk,
  isShape,
  isText,
  type SceneNode,
  type StudioDocument,
} from '../../studio';
import { displayLayerName, layerTypeHint } from './layerLabels';
import { formatDims } from './projectDisplay';

type Props = {
  doc: StudioDocument;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onReorderDisplay: (displayTopToBottom: string[]) => void;
  onLoadSample?: () => void;
};

type RowProps = {
  id: string;
  node: SceneNode;
  doc: StudioDocument;
  selected: boolean;
  depth: number;
  sortable: boolean;
  collapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  selection: string[];
  collapsedGroups: Set<string>;
};

function TypeIcon({ node }: { node: SceneNode }) {
  if (isGroup(node)) return <Folder size={14} strokeWidth={1.75} />;
  if (isInk(node)) return <Paintbrush size={14} strokeWidth={1.75} />;
  if (isImage(node)) return <ImageIcon size={14} strokeWidth={1.75} />;
  if (isText(node)) return <Type size={14} strokeWidth={1.75} />;
  if (isShape(node)) {
    switch (node.shape) {
      case 'ellipse':
        return <Circle size={14} strokeWidth={1.75} />;
      case 'line':
        return <Minus size={14} strokeWidth={1.75} />;
      case 'triangle':
        return <Triangle size={14} strokeWidth={1.75} />;
      case 'star':
        return <Star size={14} strokeWidth={1.75} />;
      case 'arrow':
        return <ArrowRight size={14} strokeWidth={1.75} />;
      case 'roundRect':
        return <Squircle size={14} strokeWidth={1.75} />;
      case 'rect':
        return <Square size={14} strokeWidth={1.75} />;
      default: {
        const _e: never = node.shape;
        void _e;
        return <Square size={14} strokeWidth={1.75} />;
      }
    }
  }
  return <Square size={14} strokeWidth={1.75} />;
}

function shouldShowTypeHint(node: SceneNode): boolean {
  // Type color + icon already carry kind; only hint when name is truncated/
  // opaque (e.g. long copy) and differs from the type label.
  const name = displayLayerName(node).trim();
  const hint = layerTypeHint(node).trim();
  if (!hint) return false;
  if (name === hint) return false;
  if (name.startsWith(hint) && /^[\s·\d]*$/.test(name.slice(hint.length))) return false;
  // Custom short names ("标题", "背景") — icon is enough.
  if (name.length <= 6) return false;
  return true;
}

function LayerRow({
  id,
  node,
  doc,
  selected,
  depth,
  sortable,
  collapsed,
  onToggleCollapse,
  onSelect,
  onToggleVisible,
  onToggleLocked,
  onDelete,
  onRename,
  selection,
  collapsedGroups,
}: RowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !sortable || node.locked });

  const style = sortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }
    : undefined;

  const commitRename = () => {
    const next = draft.trim();
    if (next && next !== node.name) onRename(id, next);
    else setDraft(node.name);
    setEditing(false);
  };

  const isGroupNode = isGroup(node);
  const childIds = isGroupNode ? [...node.children].reverse() : [];
  const showHint = shouldShowTypeHint(node);
  const pretty = displayLayerName(node);
  const hint = layerTypeHint(node);

  return (
    <>
      <li
        ref={sortable ? setNodeRef : undefined}
        className={[
          'node-item',
          selected ? 'selected' : '',
          node.locked ? 'locked' : '',
          !node.visible ? 'hidden-layer' : '',
          depth > 0 ? 'node-item-nested' : '',
          isInk(node) ? 'is-ink' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...style,
          ['--layer-depth' as string]: String(depth),
          paddingLeft: depth > 0 ? `${6 + depth * 12}px` : undefined,
        }}
      >
        {sortable ? (
          <button
            type="button"
            className="node-grip"
            title={node.locked ? '\u5df2\u9501\u5b9a' : '\u62d6\u62fd\u6392\u5e8f'}
            disabled={node.locked}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={12} strokeWidth={2} />
          </button>
        ) : (
          <span className="node-grip node-grip-spacer" aria-hidden />
        )}

        {isGroupNode ? (
          <button
            type="button"
            className="node-collapse"
            title={collapsed ? '\u5c55\u5f00' : '\u6298\u53e0'}
            onClick={() => onToggleCollapse(id)}
          >
            {collapsed ? (
              <ChevronRight size={13} strokeWidth={2} />
            ) : (
              <ChevronDown size={13} strokeWidth={2} />
            )}
          </button>
        ) : (
          <span className="node-collapse node-collapse-spacer" aria-hidden />
        )}

        <button
          type="button"
          className="node-main"
          onClick={() => onSelect(id)}
          onDoubleClick={() => {
            setDraft(node.name);
            setEditing(true);
          }}
        >
          <span className={`node-type-icon tone-${node.type}`} aria-hidden>
            <TypeIcon node={node} />
          </span>
          {editing ? (
            <input
              className="node-rename"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') {
                  setDraft(node.name);
                  setEditing(false);
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={`node-label-stack ${showHint ? 'has-hint' : 'solo'}`}
              title={showHint ? `${pretty} \u00b7 ${hint}` : pretty}
            >
              <span className="node-name">{pretty}</span>
              {showHint && <span className="node-type-hint muted">{hint}</span>}
            </span>
          )}
        </button>

        <div className="node-actions">
          <button
            type="button"
            title={node.visible ? '\u9690\u85cf' : '\u663e\u793a'}
            className={!node.visible ? 'is-off' : ''}
            onClick={() => onToggleVisible(id)}
          >
            {node.visible ? (
              <Eye size={14} strokeWidth={1.75} />
            ) : (
              <EyeOff size={14} strokeWidth={1.75} />
            )}
          </button>
          <button
            type="button"
            title={node.locked ? '\u89e3\u9501' : '\u9501\u5b9a'}
            className={node.locked ? 'active-lock' : ''}
            onClick={() => onToggleLocked(id)}
          >
            {node.locked ? (
              <Lock size={14} strokeWidth={1.75} />
            ) : (
              <LockOpen size={14} strokeWidth={1.75} />
            )}
          </button>
          <button
            type="button"
            title={'\u5220\u9664'}
            className="danger"
            onClick={() => onDelete(id)}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      </li>

      {isGroupNode && !collapsed
        ? childIds.map((childId) => {
            const child = doc.nodes[childId];
            if (!child) return null;
            return (
              <LayerRow
                key={childId}
                id={childId}
                node={child}
                doc={doc}
                selected={selection.includes(childId)}
                depth={depth + 1}
                sortable={false}
                collapsed={collapsedGroups.has(childId)}
                onToggleCollapse={onToggleCollapse}
                onSelect={onSelect}
                onToggleVisible={onToggleVisible}
                onToggleLocked={onToggleLocked}
                onDelete={onDelete}
                onRename={onRename}
                selection={selection}
                collapsedGroups={collapsedGroups}
              />
            );
          })
        : null}
    </>
  );
}

export function NodeTreePanel({
  doc,
  onSelect,
  onToggleVisible,
  onToggleLocked,
  onDelete,
  onRename,
  onReorderDisplay,
  onLoadSample,
}: Props) {
  const frame = getActiveFrame(doc);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const [seededDocKey, setSeededDocKey] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const ids = useMemo(() => {
    if (!frame || !isFrame(frame)) return [] as string[];
    return [...frame.children].reverse();
  }, [frame]);

  const docKey = `${doc.id}:${frame?.id ?? ''}`;
  useEffect(() => {
    if (seededDocKey === docKey) return;
    const initial = new Set<string>();
    for (const n of Object.values(doc.nodes)) {
      if (isGroup(n) && n.children.length >= 8) initial.add(n.id);
    }
    setCollapsedGroups(initial);
    setSeededDocKey(docKey);
  }, [doc, docKey, seededDocKey]);

  const toggleCollapse = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!frame || !isFrame(frame)) {
    return <p className="hint">{'\u65e0\u753b\u677f'}</p>;
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...ids];
    const [item] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, item!);
    onReorderDisplay(next);
  };

  return (
    <div className="node-tree">
      <div className="node-tree-frame">
        <span className="node-tree-frame-title">
          <Frame size={13} strokeWidth={1.75} />
          <span className="node-tree-frame-name">{frame.name}</span>
        </span>
        <span className="node-tree-frame-meta muted">
          {ids.length} {'\u5c42'} · {formatDims(frame.width, frame.height)}
        </span>
      </div>

      {ids.length === 0 ? (
        <div className="node-tree-empty">
          <p>{'\u8fd8\u6ca1\u6709\u56fe\u5c42'}</p>
          {onLoadSample && (
            <button type="button" className="btn primary compact" onClick={onLoadSample}>
              {'\u52a0\u8f7d\u793a\u4f8b\u56fe'}
            </button>
          )}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="node-tree-list">
              {ids.map((id) => {
                const node = doc.nodes[id];
                if (!node) return null;
                return (
                  <LayerRow
                    key={id}
                    id={id}
                    node={node}
                    doc={doc}
                    selected={doc.selection.includes(id)}
                    depth={0}
                    sortable
                    collapsed={collapsedGroups.has(id)}
                    onToggleCollapse={toggleCollapse}
                    onSelect={onSelect}
                    onToggleVisible={onToggleVisible}
                    onToggleLocked={onToggleLocked}
                    onDelete={onDelete}
                    onRename={onRename}
                    selection={doc.selection}
                    collapsedGroups={collapsedGroups}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
