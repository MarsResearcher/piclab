/**
 * Unified experiment module contract.
 * Drop a new file in experiments/ that implements this — it appears in the lab.
 */

export type ParamType = 'number' | 'boolean' | 'select' | 'color' | 'matrix' | 'range2';

export interface ParamDef {
  key: string;
  label: string;
  type: ParamType;
  default: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  /** For matrix: rows × cols */
  rows?: number;
  cols?: number;
  /** Plain-language: what this control changes in the algorithm */
  hint?: string;
}

export type ParamValues = Record<string, unknown>;

/** A curated "try this" moment — teaches a principle, not a preset filter. */
export interface Probe {
  id: string;
  label: string;
  notice: string;
  params: ParamValues;
}

export interface PointerInfo {
  /** Image-space coordinates */
  x: number;
  y: number;
  pressure: number;
}

export interface ExperimentContext {
  auxCanvas?: HTMLCanvasElement | OffscreenCanvas;
  signal?: AbortSignal;
}

export interface ExperimentResult {
  imageData: ImageData;
  /** Principle visualization (channels, mask, spectrum, residual…) */
  auxImageData?: ImageData;
  meta?: {
    narration?: string;
    auxLabel?: string;
    [key: string]: unknown;
  };
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  principle: string;
  observe: string[];
  category: 'color' | 'spatial' | 'frequency' | 'structure' | 'generative' | 'other';
  params: ParamDef[];
  probes: Probe[];

  /** What kind of direct manipulation the experiment wants */
  interaction?: {
    hint: string;
    /** Called on pointer down / drag over the image. Receives full ImageData + position. */
    onPointer?: (event: PointerEvent, info: PointerInfo, state: {
      params: ParamValues;
      setParam: (key: string, value: unknown) => void;
    }) => void;
  };

  apply(
    imageData: ImageData,
    params: ParamValues,
    ctx?: ExperimentContext,
  ): ImageData | ExperimentResult | Promise<ImageData | ExperimentResult>;
  realtime?: boolean;
}

export function defaultsFromParams(params: ParamDef[]): ParamValues {
  const values: ParamValues = {};
  for (const p of params) {
    values[p.key] = structuredClone(p.default);
  }
  return values;
}

export function asImageData(result: ImageData | ExperimentResult): ImageData {
  return result instanceof ImageData ? result : result.imageData;
}

export function asExperimentResult(result: ImageData | ExperimentResult): ExperimentResult {
  return result instanceof ImageData ? { imageData: result } : result;
}
