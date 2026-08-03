export type HistoryEntry = {
  imageData: ImageData;
  label: string;
  timestamp: number;
};

function cloneImageData(source: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(source.data),
    source.width,
    source.height,
  );
}

/**
 * Current image + undo/redo stack.
 * Snapshots are cloned ImageData — simple and reliable for lab-scale images.
 */
export type ImageStateEvent = {
  /** True when undo/redo/load/commit changed history structure (not live preview). */
  historyChanged: boolean;
};

export class ImageState {
  private current: ImageData | null = null;
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private listeners = new Set<(event: ImageStateEvent) => void>();
  private maxHistory: number;

  constructor(maxHistory = 40) {
    this.maxHistory = maxHistory;
  }

  subscribe(listener: (event: ImageStateEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(historyChanged: boolean): void {
    const event: ImageStateEvent = { historyChanged };
    for (const listener of this.listeners) listener(event);
  }

  get imageData(): ImageData | null {
    return this.current;
  }

  get width(): number {
    return this.current?.width ?? 0;
  }

  get height(): number {
    return this.current?.height ?? 0;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get historyDepth(): number {
    return this.undoStack.length;
  }

  /** Load a fresh image — clears history. */
  load(imageData: ImageData, label = 'load'): void {
    this.current = cloneImageData(imageData);
    this.undoStack = [];
    this.redoStack = [];
    void label;
    this.notify(true);
  }

  /**
   * Commit a new state. Pushes the previous frame onto the undo stack.
   * Call this after an experiment is "applied" (not during live preview).
   */
  commit(imageData: ImageData, label: string): void {
    if (this.current) {
      this.undoStack.push({
        imageData: cloneImageData(this.current),
        label,
        timestamp: Date.now(),
      });
      if (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
      }
    }
    this.current = cloneImageData(imageData);
    this.redoStack = [];
    this.notify(true);
  }

  /**
   * Update the visible image without touching history (live preview).
   * Does NOT mark historyChanged — UI must not rebuild history thumbs.
   */
  preview(imageData: ImageData): void {
    this.current = cloneImageData(imageData);
    this.notify(false);
  }

  /** Restore committed base before a preview session. */
  restore(imageData: ImageData): void {
    this.current = cloneImageData(imageData);
    this.notify(false);
  }

  /** Restore without notifying (caller paints canvas itself). */
  restoreSilent(imageData: ImageData): void {
    this.current = cloneImageData(imageData);
  }

  undo(): boolean {
    if (!this.current || this.undoStack.length === 0) return false;
    const prev = this.undoStack.pop()!;
    this.redoStack.push({
      imageData: cloneImageData(this.current),
      label: 'redo-point',
      timestamp: Date.now(),
    });
    this.current = prev.imageData;
    this.notify(true);
    return true;
  }

  redo(): boolean {
    if (!this.current || this.redoStack.length === 0) return false;
    const next = this.redoStack.pop()!;
    this.undoStack.push({
      imageData: cloneImageData(this.current),
      label: 'undo-point',
      timestamp: Date.now(),
    });
    this.current = next.imageData;
    this.notify(true);
    return true;
  }

  getSnapshot(): ImageData | null {
    return this.current ? cloneImageData(this.current) : null;
  }

  /** Timeline for the history strip: undo entries (oldest→newest) + current. */
  timeline(): { entries: { label: string; imageData: ImageData }[]; currentIndex: number } {
    const entries = this.undoStack.map((e) => ({
      label: e.label,
      imageData: e.imageData,
    }));
    if (this.current) {
      entries.push({ label: '当前', imageData: this.current });
    }
    return { entries, currentIndex: entries.length - 1 };
  }

  /** Jump to a timeline index (0 = oldest). Rebuilds stacks accordingly. */
  jumpTo(index: number): boolean {
    const { entries } = this.timeline();
    if (index < 0 || index >= entries.length || !this.current) return false;
    const target = entries[index]!;
    // Undo stack: everything before target; redo: everything after (reversed)
    this.undoStack = entries.slice(0, index).map((e) => ({
      imageData: cloneImageData(e.imageData),
      label: e.label,
      timestamp: Date.now(),
    }));
    this.redoStack = entries
      .slice(index + 1)
      .reverse()
      .map((e) => ({
        imageData: cloneImageData(e.imageData),
        label: e.label,
        timestamp: Date.now(),
      }));
    this.current = cloneImageData(target.imageData);
    this.notify(true);
    return true;
  }
}

export const imageState = new ImageState();
