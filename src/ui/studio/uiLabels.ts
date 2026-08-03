/**
 * UI copy as unicode escapes so Windows tooling cannot corrupt Chinese source.
 * Import from here instead of inlining literals in large TSX files.
 */
export const UI = {
  layers: '\u56fe\u5c42',
  props: '\u5c5e\u6027',
  loading: '\u52a0\u8f7d\u4e2d\u2026',
  del: '\u5220\u9664',
  dup: '\u590d\u5236',
  group: '\u6210\u7ec4',
  layerOrder: '\u5c42\u7ea7',
  select: '\u9009\u62e9',
  text: '\u6587\u5b57',
  shapes: '\u5f62\u72b6',
  images: '\u56fe\u7247',
  tools: '\u5de5\u5177',
} as const;

/** Stage HUD / tool status — keep escapes to avoid mojibake in source. */
export const STATUS = {
  idle: '\u9009\u62e9 \u00b7 \u7f16\u8f91 \u00b7 \u9884\u89c8 \u00b7 \u5bfc\u51fa',
  /** 文字：点击画布放置，双击编辑 */
  textTool:
    '\u6587\u5b57\uff1a\u70b9\u51fb\u753b\u5e03\u653e\u7f6e\uff0c\u53cc\u51fb\u7f16\u8f91',
  /** 画笔：在画布上拖拽绘制 */
  penTool: '\u753b\u7b14\uff1a\u5728\u753b\u5e03\u4e0a\u62d6\u62fd\u7ed8\u5236',
  /** 橡皮：点击笔划删除 */
  eraserTool: '\u6a61\u76ae\uff1a\u70b9\u51fb\u7b14\u753b\u5220\u9664',
  /** 已固化为图片素材 */
  inkBaked: '\u5df2\u56fa\u5316\u4e3a\u56fe\u7247\u7d20\u6750',
  /** 无笔划可固化 */
  inkBakeEmpty: '\u65e0\u7b14\u753b\u53ef\u56fa\u5316',
  /** 已保存模板 · {name} */
  templateSaved: (name: string) =>
    `\u5df2\u4fdd\u5b58\u6a21\u677f \u00b7 ${name}`,
  /** 文字已更新 */
  textUpdated: '\u6587\u5b57\u5df2\u66f4\u65b0',
  /** 已切换页面 */
  pageSwitched: '\u5df2\u5207\u6362\u9875\u9762',
} as const;
