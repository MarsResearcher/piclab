import { contentDefaults } from '../../studio/contentDefaults';
import { DEFAULT_STUDIO_FONT } from '../../studio/fonts/catalog';
import type { TextNode, TextWritingMode } from '../../studio';

/** Pending / last-used style for the text tool (mirrors penStyle). */
export type TextStyle = {
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  align: TextNode['align'];
  writingMode: TextWritingMode;
};

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 36,
  fontFamily: DEFAULT_STUDIO_FONT,
  color: contentDefaults.textColor,
  bold: true,
  align: 'center',
  writingMode: 'horizontal',
};

export function textStyleFromNode(node: TextNode): TextStyle {
  return {
    fontSize: node.fontSize,
    fontFamily: node.fontFamily,
    color: node.color,
    bold: node.bold,
    align: node.align,
    writingMode: node.writingMode === 'vertical' ? 'vertical' : 'horizontal',
  };
}

export function mergeTextStyle(base: TextStyle, patch: Partial<TextStyle>): TextStyle {
  return { ...base, ...patch };
}
