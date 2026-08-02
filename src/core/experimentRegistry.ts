import type { Experiment } from './experiment';

/** Playgrounds: interactive, hand-feel first. */
const playgroundLoaders: Record<string, () => Promise<{ default: Experiment }>> = {
  stirPool: () => import('../experiments/stirPool'),
  convolutionBrush: () => import('../experiments/convolutionBrush'),
  freqPainter: () => import('../experiments/freqPainter'),
};

/** Principles: structured, explanatory experiments. */
const principleLoaders: Record<string, () => Promise<{ default: Experiment }>> = {
  colorChannelSwap: () => import('../experiments/colorChannelSwap'),
  customConvolution: () => import('../experiments/customConvolution'),
  pixelSort: () => import('../experiments/pixelSort'),
  fftFilter: () => import('../experiments/fftFilter'),
  imageToQr: () => import('../experiments/imageToQr'),
};

const allLoaders = { ...playgroundLoaders, ...principleLoaders };
const cache = new Map<string, Experiment>();

export function listPlaygroundIds(): string[] {
  return Object.keys(playgroundLoaders);
}

export function listPrincipleIds(): string[] {
  return Object.keys(principleLoaders);
}

export async function loadExperiment(id: string): Promise<Experiment> {
  const cached = cache.get(id);
  if (cached) return cached;
  const loader = allLoaders[id];
  if (!loader) throw new Error(`Unknown experiment: ${id}`);
  const mod = await loader();
  const experiment = mod.default;
  if (experiment.id !== id) {
    console.warn(`Experiment id mismatch: registry="${id}" module="${experiment.id}"`);
  }
  cache.set(id, experiment);
  return experiment;
}

export async function loadPlaygrounds(): Promise<Experiment[]> {
  return Promise.all(listPlaygroundIds().map((id) => loadExperiment(id)));
}

export async function loadPrinciples(): Promise<Experiment[]> {
  return Promise.all(listPrincipleIds().map((id) => loadExperiment(id)));
}
