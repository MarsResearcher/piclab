import { useEffect, useRef, useState } from 'react';
import {
  isGroup,
  isImage,
  isInk,
  isShape,
  isText,
  type ImageNode,
  type InkNode,
  type SceneNode,
  type ShapeNode,
  type TextNode,
} from '../../studio';
import { displayLayerName, layerTypeHint } from './layerLabels';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { STUDIO_FONT_CATALOG } from '../../studio/fonts/catalog';
import {
  ColorField,
  FontPicker,
  FontSizeChips,
  StrokeWidthField,
  type ImageColorPalette,
} from './controls';

type Props = {
  node: SceneNode | null;
  onPatchSilent: (patch: Partial<SceneNode>) => void;
  onBeginEdit: () => void;
  onEndEdit: () => void;
  lockAspect: boolean;
  onLockAspectChange: (locked: boolean) => void;
  imagePalettes?: ImageColorPalette[];
};

function patchTextStrokeColor(
  hex: string,
  currentWidth: number,
): Partial<TextNode> {
  if (hex === 'transparent') {
    return { strokeColor: 'transparent', strokeWidth: 0 };
  }
  return {
    strokeColor: hex,
    strokeWidth: currentWidth > 0 ? currentWidth : 2,
  };
}

function lineLength(node: ShapeNode): number {
  return Math.round(Math.hypot(node.width, node.height));
}

function lineAngleDeg(node: ShapeNode): number {
  return Math.round((Math.atan2(node.height, node.width) * 180) / Math.PI);
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onBegin,
  onEnd,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onBegin: () => void;
  onEnd: () => void;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            className="h-7 w-16 px-1 text-right font-mono text-xs"
            value={Number.isFinite(value) ? value : 0}
            min={min}
            max={max}
            step={step}
            onFocus={onBegin}
            onBlur={onEnd}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) return;
              onChange(Math.min(max, Math.max(min, n)));
            }}
          />
          {suffix && (
            <span className="text-[10px] text-[var(--color-studio-muted)] w-3">{suffix}</span>
          )}
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onPointerDown={onBegin}
        onPointerUp={onEnd}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  );
}

export function PropsPanel({
  node,
  onPatchSilent,
  onBeginEdit,
  onEndEdit,
  lockAspect,
  onLockAspectChange,
  imagePalettes,
}: Props) {
  const [draft, setDraft] = useState<SceneNode | null>(node);
  const [fieldFocus, setFieldFocus] = useState(false);
  const aspectRef = useRef(1);

  useEffect(() => {
    if (!fieldFocus) setDraft(node);
  }, [node, fieldFocus]);

  useEffect(() => {
    if (!node || fieldFocus) return;
    if (isImage(node) || (isShape(node) && node.shape !== 'line')) {
      if (node.height > 0) aspectRef.current = node.width / node.height;
    }
  }, [node, fieldFocus]);

  if (!node || !draft) {
    return (
      <section className="props-panel props-empty">
        <p className="props-empty-title">未选中对象</p>
        <p className="hint">点选画布元素，或在左侧图层列表中选择。</p>
        <ul className="props-empty-list">
          <li>形状 / 图片从左侧插入</li>
          <li>角点缩放 · 下方旋转柄</li>
          <li>双击画布添加文字</li>
          <li>空格 + 拖拽平移画布</li>
        </ul>
      </section>
    );
  }

  const patch = (partial: Partial<SceneNode>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      if (partial.transform) {
        return {
          ...prev,
          ...partial,
          transform: { ...prev.transform, ...partial.transform },
        } as SceneNode;
      }
      return { ...prev, ...partial } as SceneNode;
    });
    if (partial.transform) {
      onPatchSilent({
        ...partial,
        transform: { ...draft.transform, ...partial.transform },
      } as Partial<SceneNode>);
      return;
    }
    onPatchSilent(partial);
  };

  const patchPos = (axis: 'x' | 'y', n: number) => {
    patch({
      transform: { ...draft.transform, [axis]: n },
    });
  };

  const patchSize = (dim: 'width' | 'height', n: number) => {
    if (!isImage(draft) && !isShape(draft)) return;
    const next: Partial<ImageNode | ShapeNode> = { [dim]: n };
    if (lockAspect && aspectRef.current > 0) {
      if (dim === 'width') next.height = Math.max(8, Math.round(n / aspectRef.current));
      else next.width = Math.max(8, Math.round(n * aspectRef.current));
    }
    patch(next as Partial<SceneNode>);
  };

  const typeHint = layerTypeHint(draft);
  const prettyName = displayLayerName(draft);

  return (
    <section className="props-panel space-y-3 overflow-y-auto pr-1">
      <div className="props-type-row">
        <span className="props-type-badge">{typeHint}</span>
        {draft.locked && <span className="props-lock-badge">已锁定</span>}
        {isGroup(draft) && (
          <span className="props-type-meta muted">{draft.children.length} 项</span>
        )}
      </div>

      {draft.locked && (
        <p className="props-lock-hint">锁定对象不可移动缩放，可在图层列表解锁。</p>
      )}

      <div className="space-y-1.5">
        <Label>名称</Label>
        <Input
          value={draft.name}
          placeholder={prettyName}
          onFocus={() => {
            setFieldFocus(true);
            onBeginEdit();
          }}
          onBlur={() => {
            setFieldFocus(false);
            onEndEdit();
          }}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </div>

      <Accordion type="multiple" defaultValue={['transform', 'content']} className="w-full">
        <AccordionItem value="transform">
          <AccordionTrigger>变换</AccordionTrigger>
          <AccordionContent>
            <NumberField
              label="X"
              value={Math.round(draft.transform.x)}
              min={-4000}
              max={8000}
              onBegin={onBeginEdit}
              onEnd={onEndEdit}
              onChange={(n) => patchPos('x', n)}
            />
            <NumberField
              label="Y"
              value={Math.round(draft.transform.y)}
              min={-4000}
              max={8000}
              onBegin={onBeginEdit}
              onEnd={onEndEdit}
              onChange={(n) => patchPos('y', n)}
            />
            <NumberField
              label="旋转"
              value={Math.round(draft.transform.rotation)}
              min={-180}
              max={180}
              suffix="°"
              onBegin={onBeginEdit}
              onEnd={onEndEdit}
              onChange={(n) =>
                patch({
                  transform: { ...draft.transform, rotation: n },
                })
              }
            />
            <NumberField
              label="不透明度"
              value={Math.round(draft.opacity * 100)}
              min={0}
              max={100}
              suffix="%"
              onBegin={onBeginEdit}
              onEnd={onEndEdit}
              onChange={(n) => patch({ opacity: n / 100 })}
            />
          </AccordionContent>
        </AccordionItem>

        {isText(draft) && (
          <AccordionItem value="content">
            <AccordionTrigger>{'\u5185\u5bb9'}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5">
                <Label>内容</Label>
                <Input
                  value={draft.content}
                  onFocus={() => {
                    setFieldFocus(true);
                    onBeginEdit();
                  }}
                  onBlur={() => {
                    setFieldFocus(false);
                    onEndEdit();
                  }}
                  onChange={(e) =>
                    patch({
                      content: e.target.value,
                      name: e.target.value.slice(0, 16) || draft.name,
                    } as Partial<TextNode>)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>字体</Label>
                <FontPicker
                  value={
                    STUDIO_FONT_CATALOG.some((f) => f.value === draft.fontFamily)
                      ? draft.fontFamily
                      : STUDIO_FONT_CATALOG[0]!.value
                  }
                  onBegin={onBeginEdit}
                  onEnd={onEndEdit}
                  onChange={(fontFamily) =>
                    patch({ fontFamily } as Partial<TextNode>)
                  }
                />
              </div>
              <FontSizeChips
                label="字号"
                value={draft.fontSize}
                onBegin={onBeginEdit}
                onEnd={onEndEdit}
                onChange={(n) => patch({ fontSize: n } as Partial<TextNode>)}
              />
              <NumberField
                label="自定义字号"
                value={draft.fontSize}
                min={12}
                max={200}
                onBegin={onBeginEdit}
                onEnd={onEndEdit}
                onChange={(n) => patch({ fontSize: n } as Partial<TextNode>)}
              />
              <NumberField
                label="行高"
                value={draft.lineHeight ?? 1.25}
                min={0.8}
                max={3}
                step={0.05}
                onBegin={onBeginEdit}
                onEnd={onEndEdit}
                onChange={(n) => patch({ lineHeight: n } as Partial<TextNode>)}
              />
              <div className="grid grid-cols-2 gap-2">
                <ColorField
                  label="填充"
                  value={draft.color}
                  allowTransparent
                  transparentLabel={'\u65e0\u586b\u5145'}
                  imagePalettes={imagePalettes}
                  onBegin={onBeginEdit}
                  onEnd={onEndEdit}
                  onChange={(hex) => patch({ color: hex } as Partial<TextNode>)}
                />
                <ColorField
                  label="描边"
                  value={
                    draft.strokeWidth <= 0 || draft.strokeColor === 'transparent'
                      ? 'transparent'
                      : draft.strokeColor
                  }
                  allowTransparent
                  transparentLabel={'\u65e0\u63cf\u8fb9'}
                  imagePalettes={imagePalettes}
                  onBegin={onBeginEdit}
                  onEnd={onEndEdit}
                  onChange={(hex) =>
                    patch(patchTextStrokeColor(hex, draft.strokeWidth))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--color-studio-text)]">
                <input
                  type="checkbox"
                  checked={draft.bold}
                  onChange={(e) => {
                    onBeginEdit();
                    patch({ bold: e.target.checked } as Partial<TextNode>);
                    onEndEdit();
                  }}
                />
                粗体
              </label>
              <div className="space-y-1.5">
                <Label>书写方向</Label>
                <div className="studio-writing-mode is-panel" role="group" aria-label="书写方向">
                  <button
                    type="button"
                    className={`studio-writing-chip ${
                      draft.writingMode !== 'vertical' ? 'active' : ''
                    }`}
                    onClick={() => {
                      onBeginEdit();
                      patch({ writingMode: 'horizontal' } as Partial<TextNode>);
                      onEndEdit();
                    }}
                  >
                    横排
                  </button>
                  <button
                    type="button"
                    className={`studio-writing-chip ${
                      draft.writingMode === 'vertical' ? 'active' : ''
                    }`}
                    title="竖排 · 字正立 · 换行列从右到左"
                    onClick={() => {
                      onBeginEdit();
                      patch({ writingMode: 'vertical' } as Partial<TextNode>);
                      onEndEdit();
                    }}
                  >
                    竖排
                  </button>
                </div>
                <p className="text-[10px] text-[var(--color-studio-muted)]">
                  {draft.writingMode === 'vertical'
                    ? '竖排：字从上到下；换行开启新列（右→左）。对齐变为顶/中/底。'
                    : '横排：常规从左到右、自上而下。'}
                </p>
              </div>
              <StrokeWidthField
                label="描边粗细"
                value={draft.strokeWidth}
                min={0}
                max={24}
                onBegin={onBeginEdit}
                onEnd={onEndEdit}
                onChange={(n) => {
                  const next: Partial<TextNode> = { strokeWidth: n };
                  if (
                    n > 0 &&
                    (!draft.strokeColor || draft.strokeColor === 'transparent')
                  ) {
                    next.strokeColor = '#000000';
                  }
                  patch(next);
                }}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {isShape(draft) && (
          <AccordionItem value="content">
            <AccordionTrigger>{'\u5916\u89c2'}</AccordionTrigger>
            <AccordionContent>
              {draft.shape === 'line' ? (
                <>
                  <NumberField
                    label="长度"
                    value={lineLength(draft)}
                    min={8}
                    max={2000}
                    onBegin={onBeginEdit}
                    onEnd={onEndEdit}
                    onChange={(len) => {
                      const ang = (lineAngleDeg(draft) * Math.PI) / 180;
                      patch({
                        width: Math.round(Math.cos(ang) * len),
                        height: Math.round(Math.sin(ang) * len),
                      } as Partial<ShapeNode>);
                    }}
                  />
                  <NumberField
                    label="角度"
                    value={lineAngleDeg(draft)}
                    min={-180}
                    max={180}
                    suffix="°"
                    onBegin={onBeginEdit}
                    onEnd={onEndEdit}
                    onChange={(deg) => {
                      const ang = (deg * Math.PI) / 180;
                      const len = lineLength(draft) || 1;
                      patch({
                        width: Math.round(Math.cos(ang) * len),
                        height: Math.round(Math.sin(ang) * len),
                      } as Partial<ShapeNode>);
                    }}
                  />
                </>
              ) : (
                <>
                  <ColorField
                    label="填充"
                    value={draft.fill}
                    allowTransparent
                    transparentLabel={'\u65e0\u586b\u5145'}
                    imagePalettes={imagePalettes}
                    onBegin={onBeginEdit}
                    onEnd={onEndEdit}
                    onChange={(hex) => patch({ fill: hex } as Partial<ShapeNode>)}
                  />
                  <label className="flex items-center gap-2 text-xs text-[var(--color-studio-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lockAspect}
                      onChange={(e) => onLockAspectChange(e.target.checked)}
                    />
                    锁定比例
                  </label>
                  <NumberField
                    label="宽度"
                    value={draft.width}
                    min={4}
                    max={2000}
                    onBegin={onBeginEdit}
                    onEnd={onEndEdit}
                    onChange={(n) => patchSize('width', n)}
                  />
                  <NumberField
                    label="高度"
                    value={draft.height}
                    min={4}
                    max={2000}
                    onBegin={onBeginEdit}
                    onEnd={onEndEdit}
                    onChange={(n) => patchSize('height', n)}
                  />
                  {draft.shape === 'roundRect' && (
                    <NumberField
                      label="圆角"
                      value={draft.cornerRadius ?? 0}
                      min={0}
                      max={200}
                      onBegin={onBeginEdit}
                      onEnd={onEndEdit}
                      onChange={(n) => patch({ cornerRadius: n } as Partial<ShapeNode>)}
                    />
                  )}
                </>
              )}
              <Separator />
              <ColorField
                label="描边"
                value={
                  draft.strokeWidth <= 0 || draft.stroke === 'transparent'
                    ? 'transparent'
                    : draft.stroke
                }
                allowTransparent
                transparentLabel={'\u65e0\u63cf\u8fb9'}
                imagePalettes={imagePalettes}
                onBegin={onBeginEdit}
                onEnd={onEndEdit}
                onChange={(hex) => {
                  if (hex === 'transparent') {
                    patch({ stroke: 'transparent', strokeWidth: 0 } as Partial<ShapeNode>);
                  } else {
                    patch({
                      stroke: hex,
                      strokeWidth: draft.strokeWidth > 0 ? draft.strokeWidth : 2,
                    } as Partial<ShapeNode>);
                  }
                }}
              />
              <StrokeWidthField
                label="描边粗细"
                value={draft.strokeWidth}
                min={0}
                max={40}
                onBegin={onBeginEdit}
                onEnd={onEndEdit}
                onChange={(n) => {
                  const next: Partial<ShapeNode> = { strokeWidth: n };
                  if (n > 0 && (!draft.stroke || draft.stroke === 'transparent')) {
                    next.stroke = '#000000';
                  }
                  patch(next);
                }}
              />
              <label className="flex items-center gap-2 text-xs text-[var(--color-studio-muted)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!draft.dash?.length}
                  onChange={(e) =>
                    patch({
                      dash: e.target.checked ? [8, 6] : undefined,
                    } as Partial<ShapeNode>)
                  }
                />
                虚线
              </label>
              <p className="text-[10px] text-[var(--color-studio-muted)] pt-1">
                {draft.shape === 'line'
                  ? '拖拽端点调整直线'
                  : '画布拖角点/边点缩放 · Shift 临时切换锁定比例'}
              </p>
            </AccordionContent>
          </AccordionItem>
        )}

        {isInk(draft) && (
          <AccordionItem value="content">
            <AccordionTrigger>{'\u5916\u89c2'}</AccordionTrigger>
            <AccordionContent>
              <ColorField
                label="颜色"
                value={draft.stroke}
                imagePalettes={imagePalettes}
                onBegin={onBeginEdit}
                onEnd={onEndEdit}
                onChange={(hex) => patch({ stroke: hex } as Partial<InkNode>)}
              />
              <StrokeWidthField
                label="粗细"
                value={draft.strokeWidth}
                min={1}
                max={40}
                onBegin={onBeginEdit}
                onEnd={onEndEdit}
                onChange={(n) => patch({ strokeWidth: n } as Partial<InkNode>)}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {isImage(draft) && (
          <AccordionItem value="content">
            <AccordionTrigger>{'\u5185\u5bb9'}</AccordionTrigger>
            <AccordionContent>
              <label className="flex items-center gap-2 text-xs text-[var(--color-studio-muted)] mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lockAspect}
                  onChange={(e) => onLockAspectChange(e.target.checked)}
                />
                锁定比例
              </label>
              <NumberField
                label="宽度"
                value={Math.round(draft.width)}
                min={8}
                max={8000}
                onBegin={onBeginEdit}
                onEnd={onEndEdit}
                onChange={(n) => patchSize('width', n)}
              />
              <NumberField
                label="高度"
                value={Math.round(draft.height)}
                min={8}
                max={8000}
                onBegin={onBeginEdit}
                onEnd={onEndEdit}
                onChange={(n) => patchSize('height', n)}
              />
              <p className="text-[10px] text-[var(--color-studio-muted)] pt-1">
                画布拖角点缩放 · Shift 临时切换锁定比例
              </p>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </section>
  );
}
