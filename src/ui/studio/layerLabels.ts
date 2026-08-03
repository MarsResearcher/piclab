import {
  isGroup,
  isImage,
  isInk,
  isShape,
  isText,
  type SceneNode,
  type ShapeNode,
} from '../../studio';

function shapeKindLabel(shape: ShapeNode['shape']): string {
  switch (shape) {
    case 'rect':
      return '矩形';
    case 'roundRect':
      return '圆角';
    case 'ellipse':
      return '椭圆';
    case 'triangle':
      return '三角';
    case 'line':
      return '直线';
    case 'star':
      return '星形';
    case 'arrow':
      return '箭头';
    default: {
      const _e: never = shape;
      void _e;
      return '形状';
    }
  }
}

/** True if name looks like mojibake / id junk / empty. */
export function isWeakLayerName(name: string): boolean {
  const n = name.trim();
  if (!n) return true;
  if (/^[?\uFFFD\s._-]+$/.test(n)) return true;
  // bare id-like fragments: d335, m1k2x…
  if (/^[a-z]\d{2,}$/i.test(n)) return true;
  if (/^(shape|text|image|group|node|ink)_/i.test(n)) return true;
  return false;
}

/**
 * Human label for the layers list. Keeps good names; maps grid codes
 * (h12 / v3 / p0) and weak names to readable Chinese.
 */
export function displayLayerName(node: SceneNode): string {
  const raw = node.name?.trim() ?? '';

  if (isGroup(node)) {
    if (!isWeakLayerName(raw) && raw.length <= 24) {
      return raw;
    }
    return `编组 · ${node.children.length}`;
  }

  if (isShape(node) && node.shape === 'line') {
    const m = /^(h|v|p|m|d)(\d+)$/i.exec(raw);
    if (m) {
      const kind = m[1]!.toLowerCase();
      const n = m[2]!;
      if (kind === 'h') return `横线 ${n}`;
      if (kind === 'v') return `竖线 ${n}`;
      if (kind === 'p') return `拼音线 ${n}`;
      if (kind === 'm') return `米字线 ${n}`;
      if (kind === 'd') return `斜线 ${n}`;
      return `线 ${n}`;
    }
    if (!isWeakLayerName(raw)) return raw;
    const horiz = Math.abs(node.height) < 1 || Math.abs(node.height) < Math.abs(node.width) * 0.05;
    const vert = Math.abs(node.width) < 1 || Math.abs(node.width) < Math.abs(node.height) * 0.05;
    if (horiz) return '横线';
    if (vert) return '竖线';
    return '斜线';
  }

  if (!isWeakLayerName(raw)) return raw;

  if (isText(node)) {
    const t = node.content.replace(/\s+/g, ' ').trim();
    return t ? t.slice(0, 16) : '文字';
  }
  if (isImage(node)) return '图片';
  if (isInk(node)) return '笔画';
  if (isShape(node)) return shapeKindLabel(node.shape);
  return '图层';
}

export function layerTypeHint(node: SceneNode): string {
  if (isGroup(node)) return '组';
  if (isText(node)) return '文字';
  if (isImage(node)) return '图片';
  if (isInk(node)) return '笔画';
  if (isShape(node)) return shapeKindLabel(node.shape);
  return node.type;
}
