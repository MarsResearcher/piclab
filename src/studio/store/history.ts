import { cloneDocument, type StudioDocument } from '../model';

export type HistoryPushOpts = {
  /** Same key within coalesceMs replaces stacking — one undo for continuous edits. */
  coalesceKey?: string;
  coalesceMs?: number;
};

type StackEntry = {
  doc: StudioDocument;
  coalesceKey?: string;
  at: number;
};

/**
 * Snapshot history with coalesce support.
 * Stack stores "before" documents; undo restores the last before and pushes current to redo.
 */
export class DocHistory {
  private undoStack: StackEntry[] = [];
  private redoStack: StudioDocument[] = [];
  private max = 50;
  private defaultCoalesceMs = 800;

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Record `doc` as the state before an upcoming mutation.
   * If coalesceKey matches the last entry within the window, skip (keep original before).
   */
  push(doc: StudioDocument, opts?: HistoryPushOpts): void {
    const key = opts?.coalesceKey;
    const windowMs = opts?.coalesceMs ?? this.defaultCoalesceMs;
    const now = Date.now();
    const last = this.undoStack[this.undoStack.length - 1];

    if (
      key &&
      last?.coalesceKey === key &&
      now - last.at < windowMs
    ) {
      // Refresh coalesce window without adding a new undo step
      last.at = now;
      return;
    }

    this.undoStack.push({
      doc: cloneDocument(doc),
      coalesceKey: key,
      at: now,
    });
    if (this.undoStack.length > this.max) this.undoStack.shift();
    this.redoStack = [];
  }

  /** Force a non-coalesced checkpoint (structural edits, end of explicit transaction). */
  checkpoint(doc: StudioDocument): void {
    this.push(doc);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(current: StudioDocument): StudioDocument | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    this.redoStack.push(cloneDocument(current));
    return entry.doc;
  }

  redo(current: StudioDocument): StudioDocument | null {
    if (this.redoStack.length === 0) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push({
      doc: cloneDocument(current),
      at: Date.now(),
    });
    return next;
  }
}
