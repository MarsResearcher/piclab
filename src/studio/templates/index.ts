export { listBuiltinTemplates, getBuiltinTemplate, buildBuiltinDocument } from './builtins';
export type {
  BuiltinBuildContext,
  BuiltinTemplate,
  TemplateLayer,
  TemplatePick,
} from './types';
export {
  loadTemplateAsset,
  makeCoverImage,
  makeImageInRect,
  clearTemplateAssetCache,
  listTemplateAssetIds,
  type TemplateAssetId,
} from './templateAssets';
export {
  STOCK_CATALOG,
  STOCK_BY_ID,
  stockLibrarySourceId,
  type StockItem,
  type StockCategory,
} from './stockCatalog';
export {
  makeRoleText,
  stackOffset,
  RAMP_POSTER,
  RAMP_CARD,
  RAMP_SQUARE,
  RAMP_XHS,
  type TypeRole,
  type TypeRamp,
} from './templateType';
export { condenseText, rotateText, makeAccentStroke } from './templateCraft';
export {
  DEFAULT_XHS_THEME,
  XHS_PALETTES,
  XHS_SKIN_META,
  XHS_BG_META,
  XHS_SCALE_META,
  XHS_NAME,
  XHS_W,
  XHS_H,
  applyXhsTheme,
  getXhsPalette,
  resolveXhsTheme,
  parseXhsCardTypeFromFrame,
  xhsFrameName,
  type XhsTheme,
  type XhsSkin,
  type XhsPaletteId,
  type XhsBg,
  type XhsTypeScale,
} from './xhsTheme';
export {
  XHS_CARD_TYPES,
  XHS_CARD_SAMPLES,
  XHS_SUITE_PRESETS,
  buildXhsCardDocument,
  buildXhsCardNodes,
  buildXhsSuiteDocument,
  getXhsCardType,
  type XhsCardTypeId,
  type XhsCardTypeMeta,
} from './xhsCardTypes';
export {
  STICKER_CATALOG,
  STICKER_BY_ID,
  listStickersByTag,
  type StickerItem,
  type StickerTag,
  type StickerId,
} from './stickerCatalog';
export { loadSticker, placeSticker, scatterStickers, listStickerIds } from './stickerAssets';
export { remapDocumentIds } from './remap';
export {
  getBuiltinPreviewThumb,
  getScenePreviewThumb,
  getPickPreviewHiRes,
  warmTemplatePreviews,
  renderDocumentThumb,
  imageDataToThumbDataUrl,
  type PreviewQuality,
} from './previewThumb';
