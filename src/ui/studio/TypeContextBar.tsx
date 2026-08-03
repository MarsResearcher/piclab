import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Circle,
  Minus,
  Plus,
  Square,
  Squircle,
} from 'lucide-react';
import {
  isImage,
  isInk,
  isShape,
  isText,
  type ImageMask,
  type ImageNode,
  type InkNode,
  type SceneNode,
  type ShapeNode,
  type TextNode,
} from '../../studio';
import { IconBtn } from './IconBtn';
import {
  ColorField,
  FontPicker,
  StrokeWidthField,
  type ImageColorPalette,
} from './controls';
import type { TextStyle } from './textStyle';

type Props = {
  node: SceneNode;
  onPatch: (patch: Partial<SceneNode>) => void;
  onBegin?: () => void;
  onEnd?: () => void;
  onBakeInk?: () => void;
  imagePalettes?: ImageColorPalette[];
};

function stepFont(size: number, dir: 1 | -1): number {
  const next = size + dir * (size >= 48 ? 4 : size >= 24 ? 2 : 1);
  return Math.min(200, Math.max(10, next));
}

function TextStyleControls({
  style,
  onChange,
  showFont = false,
  onBegin,
  onEnd,
  imagePalettes,
}: {
  style: TextStyle;
  onChange: (patch: Partial<TextStyle>) => void;
  showFont?: boolean;
  onBegin?: () => void;
  onEnd?: () => void;
  imagePalettes?: ImageColorPalette[];
}) {
  const apply = (patch: Partial<TextStyle>) => {
    onBegin?.();
    onChange(patch);
    onEnd?.();
  };
  const vertical = style.writingMode === 'vertical';
  return (
    <>
      {showFont && (
        <>
          <FontPicker
            compact
            value={style.fontFamily}
            onBegin={onBegin}
            onEnd={onEnd}
            onChange={(fontFamily) => onChange({ fontFamily })}
          />
          <span className="studio-sel-sep" />
        </>
      )}
      <IconBtn
        size="sm"
        label="减小字号"
        onClick={() => apply({ fontSize: stepFont(style.fontSize, -1) })}
      >
        <Minus size={14} strokeWidth={2} />
      </IconBtn>
      <span className="studio-type-bar-value">{Math.round(style.fontSize)}</span>
      <IconBtn
        size="sm"
        label="增大字号"
        onClick={() => apply({ fontSize: stepFont(style.fontSize, 1) })}
      >
        <Plus size={14} strokeWidth={2} />
      </IconBtn>
      <span className="studio-sel-sep" />
      <ColorField
        compact
        label="填充色"
        value={style.color}
        allowTransparent
        transparentLabel={'\u65e0\u586b\u5145'}
        imagePalettes={imagePalettes}
        onBegin={onBegin}
        onEnd={onEnd}
        onChange={(hex) => onChange({ color: hex })}
      />
      <IconBtn
        size="sm"
        label="粗体"
        active={style.bold}
        onClick={() => apply({ bold: !style.bold })}
      >
        <Bold size={14} strokeWidth={2.25} />
      </IconBtn>
      <span className="studio-sel-sep" />
      <div className="studio-writing-mode" role="group" aria-label="书写方向">
        <button
          type="button"
          className={`studio-writing-chip ${!vertical ? 'active' : ''}`}
          title="横排"
          onClick={() => apply({ writingMode: 'horizontal' })}
        >
          横
        </button>
        <button
          type="button"
          className={`studio-writing-chip ${vertical ? 'active' : ''}`}
          title="竖排 · 字正立 · 列从右到左"
          onClick={() => apply({ writingMode: 'vertical' })}
        >
          竖
        </button>
      </div>
      <span className="studio-sel-sep" />
      <IconBtn
        size="sm"
        label={vertical ? '顶对齐' : '左对齐'}
        active={style.align === 'left'}
        onClick={() => apply({ align: 'left' })}
      >
        <AlignLeft size={14} strokeWidth={1.75} />
      </IconBtn>
      <IconBtn
        size="sm"
        label={vertical ? '垂直居中' : '居中'}
        active={style.align === 'center'}
        onClick={() => apply({ align: 'center' })}
      >
        <AlignCenter size={14} strokeWidth={1.75} />
      </IconBtn>
      <IconBtn
        size="sm"
        label={vertical ? '底对齐' : '右对齐'}
        active={style.align === 'right'}
        onClick={() => apply({ align: 'right' })}
      >
        <AlignRight size={14} strokeWidth={1.75} />
      </IconBtn>
    </>
  );
}

/** Style bar shown while the text tool is active (before placing text). */
export function PendingTextStyleBar({
  style,
  onChange,
  imagePalettes,
}: {
  style: TextStyle;
  onChange: (patch: Partial<TextStyle>) => void;
  imagePalettes?: ImageColorPalette[];
}) {
  return (
    <div className="studio-type-bar glass" onPointerDown={(e) => e.stopPropagation()}>
      <span className="studio-type-pending-label">文本样式</span>
      <span className="studio-sel-sep" />
      <TextStyleControls
        style={style}
        onChange={onChange}
        showFont
        imagePalettes={imagePalettes}
      />
    </div>
  );
}

export function TypeContextBar({
  node,
  onPatch,
  onBegin,
  onEnd,
  onBakeInk,
  imagePalettes,
}: Props) {
  if (isText(node)) {
    const strokeNone =
      node.strokeWidth <= 0 || node.strokeColor === 'transparent';
    return (
      <div className="studio-type-bar glass" onPointerDown={(e) => e.stopPropagation()}>
        <TextStyleControls
          style={{
            fontSize: node.fontSize,
            fontFamily: node.fontFamily,
            color: node.color,
            bold: node.bold,
            align: node.align,
            writingMode: node.writingMode === 'vertical' ? 'vertical' : 'horizontal',
          }}
          onChange={(patch) => onPatch(patch as Partial<TextNode>)}
          onBegin={onBegin}
          onEnd={onEnd}
          showFont
          imagePalettes={imagePalettes}
        />
        <span className="studio-sel-sep" />
        <ColorField
          compact
          label="描边"
          value={strokeNone ? 'transparent' : node.strokeColor}
          allowTransparent
          transparentLabel={'\u65e0\u63cf\u8fb9'}
          imagePalettes={imagePalettes}
          onBegin={onBegin}
          onEnd={onEnd}
          onChange={(hex) => {
            if (hex === 'transparent') {
              onPatch({ strokeColor: 'transparent', strokeWidth: 0 });
            } else {
              onPatch({
                strokeColor: hex,
                strokeWidth: node.strokeWidth > 0 ? node.strokeWidth : 2,
              });
            }
          }}
        />
        <StrokeWidthField
          compact
          value={node.strokeWidth}
          min={0}
          max={24}
          onBegin={onBegin}
          onEnd={onEnd}
          onChange={(n) => {
            const next: Partial<TextNode> = { strokeWidth: n };
            if (n > 0 && (!node.strokeColor || node.strokeColor === 'transparent')) {
              next.strokeColor = '#000000';
            }
            onPatch(next);
          }}
        />
      </div>
    );
  }

  if (isShape(node) && node.shape !== 'line') {
    return (
      <div className="studio-type-bar glass" onPointerDown={(e) => e.stopPropagation()}>
        <ColorField
          compact
          label="填充"
          value={node.fill}
          allowTransparent
          transparentLabel={'\u65e0\u586b\u5145'}
          imagePalettes={imagePalettes}
          onBegin={onBegin}
          onEnd={onEnd}
          onChange={(hex) => onPatch({ fill: hex } as Partial<ShapeNode>)}
        />
        <ColorField
          compact
          label="描边"
          value={
            node.strokeWidth <= 0 || node.stroke === 'transparent'
              ? 'transparent'
              : node.stroke
          }
          allowTransparent
          transparentLabel={'\u65e0\u63cf\u8fb9'}
          imagePalettes={imagePalettes}
          onBegin={onBegin}
          onEnd={onEnd}
          onChange={(hex) => {
            if (hex === 'transparent') {
              onPatch({ stroke: 'transparent', strokeWidth: 0 } as Partial<ShapeNode>);
            } else {
              onPatch({
                stroke: hex,
                strokeWidth: node.strokeWidth > 0 ? node.strokeWidth : 2,
              } as Partial<ShapeNode>);
            }
          }}
        />
        <StrokeWidthField
          compact
          value={node.strokeWidth || 0}
          min={0}
          max={40}
          onBegin={onBegin}
          onEnd={onEnd}
          onChange={(n) => {
            const next: Partial<ShapeNode> = { strokeWidth: n };
            if (n > 0 && (!node.stroke || node.stroke === 'transparent')) {
              next.stroke = '#000000';
            }
            onPatch(next);
          }}
        />
        <IconBtn
          size="sm"
          label="虚线"
          active={!!node.dash?.length}
          onClick={() => {
            onBegin?.();
            onPatch({
              dash: node.dash?.length ? undefined : [8, 6],
            } as Partial<ShapeNode>);
            onEnd?.();
          }}
        >
          <span className="studio-type-dash">---</span>
        </IconBtn>
      </div>
    );
  }

  if (isShape(node) && node.shape === 'line') {
    return (
      <div className="studio-type-bar glass" onPointerDown={(e) => e.stopPropagation()}>
        <ColorField
          compact
          label="颜色"
          value={node.stroke}
          imagePalettes={imagePalettes}
          onBegin={onBegin}
          onEnd={onEnd}
          onChange={(hex) => onPatch({ stroke: hex } as Partial<ShapeNode>)}
        />
        <StrokeWidthField
          compact
          value={node.strokeWidth}
          min={1}
          max={40}
          onBegin={onBegin}
          onEnd={onEnd}
          onChange={(n) => onPatch({ strokeWidth: n } as Partial<ShapeNode>)}
        />
        <IconBtn
          size="sm"
          label="虚线"
          active={!!node.dash?.length}
          onClick={() => {
            onBegin?.();
            onPatch({
              dash: node.dash?.length ? undefined : [8, 6],
            } as Partial<ShapeNode>);
            onEnd?.();
          }}
        >
          <span className="studio-type-dash">---</span>
        </IconBtn>
      </div>
    );
  }

  if (isInk(node)) {
    return (
      <div className="studio-type-bar glass" onPointerDown={(e) => e.stopPropagation()}>
        <ColorField
          compact
          label={'\u989c\u8272'}
          value={node.stroke}
          imagePalettes={imagePalettes}
          onBegin={onBegin}
          onEnd={onEnd}
          onChange={(hex) => onPatch({ stroke: hex } as Partial<InkNode>)}
        />
        <StrokeWidthField
          compact
          value={node.strokeWidth}
          min={1}
          max={40}
          onBegin={onBegin}
          onEnd={onEnd}
          onChange={(n) => onPatch({ strokeWidth: n } as Partial<InkNode>)}
        />
        {onBakeInk && (
          <>
            <span className="studio-sel-sep" />
            <button type="button" className="studio-type-bake" onClick={onBakeInk}>
              {'\u56fa\u5316'}
            </button>
          </>
        )}
      </div>
    );
  }

  if (isImage(node)) {
    const mask = node.mask ?? 'none';
    const setMask = (next: ImageMask) => {
      onBegin?.();
      onPatch({
        mask: next,
        maskRadius:
          next === 'roundRect'
            ? node.maskRadius ?? Math.round(Math.min(node.width, node.height) * 0.12)
            : node.maskRadius,
      } as Partial<ImageNode>);
      onEnd?.();
    };
    return (
      <div className="studio-type-bar glass" onPointerDown={(e) => e.stopPropagation()}>
        <IconBtn size="sm" label={'\u77e9\u5f62'} active={mask === 'none'} onClick={() => setMask('none')}>
          <Square size={14} strokeWidth={1.75} />
        </IconBtn>
        <IconBtn
          size="sm"
          label={'\u5706\u5f62'}
          active={mask === 'ellipse'}
          onClick={() => setMask('ellipse')}
        >
          <Circle size={14} strokeWidth={1.75} />
        </IconBtn>
        <IconBtn
          size="sm"
          label={'\u5706\u89d2'}
          active={mask === 'roundRect'}
          onClick={() => setMask('roundRect')}
        >
          <Squircle size={14} strokeWidth={1.75} />
        </IconBtn>
      </div>
    );
  }

  return null;
}

/** Whether this node type shows a type context bar (images use ImageContextBar). */
export function hasTypeContextBar(node: SceneNode | null | undefined): boolean {
  if (!node) return false;
  return isText(node) || isShape(node) || isInk(node);
}
