import { useEffect, useRef, useState } from 'react';
import type { TextNode } from '../../studio';

type Props = {
  node: TextNode;
  style?: React.CSSProperties;
  onLiveChange: (content: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

/**
 * Canvas-anchored multiline text editor with local draft.
 * Must not be a controlled input bound to gesturing DocStore — that drops keystrokes.
 */
export function TextEditOverlay({ node, style, onLiveChange, onCommit, onCancel }: Props) {
  const [draft, setDraft] = useState(node.content);
  const focusedRef = useRef(false);
  const nodeId = node.id;
  const lineCount = Math.max(1, draft.split('\n').length);

  useEffect(() => {
    if (!focusedRef.current) setDraft(node.content);
  }, [node.id, node.content]);

  return (
    <div className="studio-text-edit glass anchored" style={style}>
      <textarea
        autoFocus
        rows={Math.min(8, lineCount + 1)}
        value={draft}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          onLiveChange(next);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            focusedRef.current = false;
            onCommit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            focusedRef.current = false;
            onCancel();
          }
        }}
        onBlur={() => {
          focusedRef.current = false;
          onCommit();
        }}
        aria-label={`编辑文字 ${nodeId}`}
      />
    </div>
  );
}
