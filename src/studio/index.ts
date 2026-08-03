/**
 * PicLab Studio kernel — layered architecture:
 *
 *   model/   — document & node types (pure data)
 *   store/   — DocStore, AssetStore, history, project persistence
 *   engine/  — renderer, hit-test, text metrics
 *   plugins/ — ToolPlugin / ScenePlugin host
 *   scenes/  — scene packs (card, poster, …)
 *
 * UI lives in src/ui/studio and must only talk to stores/plugins — never pixels.
 */

export * from './model';
export * from './store';
export * from './engine';
export { contentDefaults, type ContentDefaults } from './contentDefaults';
export {
  registerBuiltinTools,
  registerTool,
  getTool,
  listTools,
  listScenes,
  getScene,
} from './plugins/host';
export type { ToolPlugin, ScenePlugin, ToolContext, SceneCreateOptions } from './plugins/types';
export {
  listBuiltinTemplates,
  getBuiltinTemplate,
  buildBuiltinDocument,
  remapDocumentIds,
  getBuiltinPreviewThumb,
  getScenePreviewThumb,
  getPickPreviewHiRes,
  warmTemplatePreviews,
  imageDataToThumbDataUrl,
  DEFAULT_XHS_THEME,
  XHS_PALETTES,
  XHS_SKIN_META,
  XHS_BG_META,
  XHS_SCALE_META,
  XHS_NAME,
  XHS_W,
  XHS_H,
  XHS_CARD_TYPES,
  XHS_CARD_SAMPLES,
  XHS_SUITE_PRESETS,
  applyXhsTheme,
  getXhsPalette,
  resolveXhsTheme,
  parseXhsCardTypeFromFrame,
  xhsFrameName,
  buildXhsCardDocument,
  buildXhsCardNodes,
  buildXhsSuiteDocument,
  getXhsCardType,
  type BuiltinBuildContext,
  type BuiltinTemplate,
  type TemplateLayer,
  type TemplatePick,
  type XhsTheme,
  type XhsSkin,
  type XhsPaletteId,
  type XhsBg,
  type XhsTypeScale,
  type XhsCardTypeId,
  type XhsCardTypeMeta,
} from './templates';
export {
  XHS_TEXT_CARD_STYLES,
  XHS_TEXT_SAMPLES,
  getXhsTextCardStyle,
  type XhsTextCardStyle,
  type XhsTextCardStyleId,
} from './scenes/xhsNote';
export * from './export';
export { runOfflineSmoke, assertOfflineSmoke, type SmokeResult } from './smoke/offlinePath';
