import type { SceneNode, Transform2D } from '../model';
import type { AlignEdge } from '../engine/align';

/** High-level mutations UI/tools should prefer over ad-hoc withDoc. */
export type DocCommand =
  | { type: 'setSelection'; ids: string[] }
  | { type: 'patchNode'; id: string; patch: Partial<SceneNode>; coalesceKey?: string }
  | { type: 'patchTransform'; id: string; transform: Partial<Transform2D>; coalesceKey?: string }
  | { type: 'deleteNodes'; ids: string[] }
  | { type: 'setVisibility'; id: string; visible: boolean }
  | { type: 'setLocked'; id: string; locked: boolean }
  | { type: 'rename'; id: string; name: string }
  | { type: 'reorder'; id: string; delta: number }
  | { type: 'reorderDisplay'; ids: string[] }
  | { type: 'setActivePage'; pageId: string }
  | {
      type: 'addPage';
      name: string;
      width: number;
      height: number;
      fill?: string;
    }
  | { type: 'renamePage'; pageId: string; name: string }
  | { type: 'duplicateNodes'; ids: string[] }
  | { type: 'groupNodes'; ids: string[] }
  | { type: 'ungroup'; groupId: string }
  | { type: 'flipNodes'; ids: string[]; axis: 'h' | 'v' }
  | { type: 'layerOrder'; ids: string[]; action: 'front' | 'back' | 'forward' | 'backward' }
  | { type: 'alignToFrame'; ids: string[]; edge: AlignEdge };

export function coalesceKeyForNodePatch(id: string, patch: Partial<SceneNode>): string {
  const keys = Object.keys(patch).sort().join(',');
  return `node:${id}:${keys}`;
}
