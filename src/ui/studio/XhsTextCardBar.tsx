import {
  XHS_CARD_SAMPLES,
  XHS_TEXT_CARD_STYLES,
  XHS_TEXT_SAMPLES,
  type XhsCardTypeId,
  type XhsTextCardStyle,
} from '../../studio';
import { isText, type SceneNode, type TextNode } from '../../studio';

type Props = {
  selected: SceneNode | null;
  cardType?: XhsCardTypeId | null;
  onPatchText: (patch: Partial<TextNode>) => void;
  /** Quick style preset → parent applies full theme. */
  onApplyStyle: (style: XhsTextCardStyle) => void;
  onBegin?: () => void;
  onEnd?: () => void;
};

/**
 * 文字配图控件：快捷风格 + 按页类型文案样例 + 字号档。
 */
export function XhsTextCardBar({
  selected,
  cardType,
  onPatchText,
  onApplyStyle,
  onBegin,
  onEnd,
}: Props) {
  if (!selected || !isText(selected)) return null;

  const samples =
    cardType && XHS_CARD_SAMPLES[cardType]
      ? XHS_CARD_SAMPLES[cardType]
      : [...XHS_TEXT_SAMPLES];

  const applyText = (patch: Partial<TextNode>) => {
    onBegin?.();
    onPatchText(patch);
    onEnd?.();
  };

  const applyStyle = (style: XhsTextCardStyle) => {
    onBegin?.();
    onApplyStyle(style);
    onEnd?.();
  };

  return (
    <div className="studio-xhs-hook-bar glass" onPointerDown={(e) => e.stopPropagation()}>
      <span className="studio-xhs-hook-label">{'\u6587\u5b57\u914d\u56fe'}</span>
      <div className="studio-xhs-hook-chips">
        {XHS_TEXT_CARD_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="studio-xhs-hook-chip"
            title={`${s.label} · ${s.bg}`}
            onClick={() => applyStyle(s)}
          >
            <span
              className="studio-xhs-style-dot"
              style={{ background: s.bg, borderColor: s.textColor }}
              aria-hidden
            />
            {s.label}
          </button>
        ))}
      </div>
      <span className="studio-sel-sep" />
      <div className="studio-xhs-hook-chips">
        {samples.map((text) => (
          <button
            key={text}
            type="button"
            className="studio-xhs-hook-chip"
            onClick={() => applyText({ content: text })}
          >
            {text}
          </button>
        ))}
      </div>
      <span className="studio-sel-sep" />
      <div className="studio-xhs-hook-chips">
        {(
          [
            { label: '\u5927\u5b57', size: 64 },
            { label: '\u6b63\u6587', size: 44 },
            { label: '\u5c0f\u5b57', size: 28 },
          ] as const
        ).map((t) => (
          <button
            key={t.label}
            type="button"
            className="studio-xhs-hook-chip"
            onClick={() => applyText({ fontSize: t.size })}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
