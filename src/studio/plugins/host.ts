import type { ScenePlugin, ToolPlugin } from './types';
import type { SceneId } from '../model';
import { retouchScene } from '../scenes/retouch';
import { cardScene } from '../scenes/card';
import { posterScene } from '../scenes/poster';
import { adScene } from '../scenes/ad';
import { socialScene } from '../scenes/social';
import { wechatCoverScene } from '../scenes/wechatCover';
import { xhsNoteScene } from '../scenes/xhsNote';
import { calligraphyScene, pinyinScene, tianzigeScene } from '../scenes/grids';

const scenePlugins: ScenePlugin[] = [
  retouchScene,
  cardScene,
  posterScene,
  adScene,
  socialScene,
  wechatCoverScene,
  xhsNoteScene,
  tianzigeScene,
  pinyinScene,
  calligraphyScene,
];

const toolPlugins = new Map<string, ToolPlugin>();

export function registerTool(plugin: ToolPlugin): void {
  toolPlugins.set(plugin.id, plugin);
}

export function getTool(id: string): ToolPlugin | undefined {
  return toolPlugins.get(id);
}

export function listTools(): ToolPlugin[] {
  return [...toolPlugins.values()];
}

export function listScenes(): ScenePlugin[] {
  return scenePlugins;
}

export function getScene(id: SceneId): ScenePlugin | undefined {
  return scenePlugins.find((s) => s.id === id);
}

/** Built-in lightweight tool stubs — behavior lives in StudioEditor host. */
export function registerBuiltinTools(): void {
  const stub = (id: string, label: string): ToolPlugin => ({
    id,
    label,
    activate: () => undefined,
    deactivate: () => undefined,
  });
  for (const t of [
    stub('select', '选择'),
    stub('text', '文字'),
    stub('shape', '形状'),
    stub('image', '图片'),
    stub('export', '导出'),
  ]) {
    registerTool(t);
  }
}
