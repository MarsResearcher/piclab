type PendingJob = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  transfer?: Transferable[];
};

type WorkerFactory = () => Worker;

/**
 * Tiny pool that round-robins jobs to Web Workers.
 * Workers speak { id, type, payload } → { id, result } | { id, error }.
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private cursor = 0;
  private pending = new Map<string, PendingJob>();
  private seq = 0;

  constructor(factory: WorkerFactory, size = Math.min(4, navigator.hardwareConcurrency || 2)) {
    for (let i = 0; i < size; i++) {
      const worker = factory();
      worker.onmessage = (ev: MessageEvent) => this.onMessage(ev);
      worker.onerror = (err) => {
        console.error('[WorkerPool]', err);
      };
      this.workers.push(worker);
    }
  }

  run<TResult = unknown, TPayload = unknown>(
    type: string,
    payload: TPayload,
    transfer?: Transferable[],
  ): Promise<TResult> {
    if (this.workers.length === 0) {
      return Promise.reject(new Error('WorkerPool has no workers'));
    }

    const id = `job-${++this.seq}`;
    const worker = this.workers[this.cursor % this.workers.length]!;
    this.cursor += 1;

    return new Promise<TResult>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
        transfer,
      });
      worker.postMessage({ id, type, payload }, transfer ?? []);
    });
  }

  private onMessage(ev: MessageEvent): void {
    const data = ev.data as { id: string; result?: unknown; error?: string };
    const job = this.pending.get(data.id);
    if (!job) return;
    this.pending.delete(data.id);
    if (data.error) {
      job.reject(new Error(data.error));
    } else {
      job.resolve(data.result);
    }
  }

  dispose(): void {
    for (const worker of this.workers) worker.terminate();
    this.workers = [];
    for (const [, job] of this.pending) {
      job.reject(new Error('WorkerPool disposed'));
    }
    this.pending.clear();
  }
}

let pixelOpsPool: WorkerPool | null = null;

export function getPixelOpsPool(): WorkerPool {
  if (!pixelOpsPool) {
    pixelOpsPool = new WorkerPool(
      () => new Worker(new URL('../workers/pixelOps.worker.ts', import.meta.url), { type: 'module' }),
      2,
    );
  }
  return pixelOpsPool;
}
