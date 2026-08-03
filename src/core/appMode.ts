/** Top-level product modes — mutually exclusive mental models. */
export type AppMode = 'make' | 'play' | 'learn';

export const APP_MODES: { id: AppMode; label: string; hint: string }[] = [
  { id: 'make', label: '制作', hint: '出图工作台：裁剪、调色、加字、导出' },
  { id: 'play', label: '玩法', hint: '动手玩：搅动、笔刷、频谱作画' },
  { id: 'learn', label: '原理', hint: '理解图像：探针、对照、辅视窗' },
];

export function modeOfExperiment(
  id: string,
  playgroundIds: Set<string>,
  principleIds: Set<string>,
): AppMode | null {
  if (playgroundIds.has(id)) return 'play';
  if (principleIds.has(id)) return 'learn';
  return null;
}
