/** Rendering & interaction engine — canvas paint, hit-test, metrics. */
export { StudioRenderer } from './renderer';
export { hitTestFrame, type HitResult } from './hitTest';
export {
  measureTextBounds,
  textHitBox,
  textColumns,
  isVerticalText,
  verticalColumnGap,
  type TextBounds,
} from './textMetrics';
export {
  getLocalBounds,
  getNodeBounds,
  frameBounds,
  listSiblingBounds,
  type AABB,
} from './bounds';
export { snapBounds, type GuideLine, type SnapResult } from './snap';
export { themeColors } from './themeColors';
export {
  applyBoxResize,
  applyBoxResizeLocal,
  applyLineResize,
  applyTextCornerScale,
  cursorForHandle,
  getBoxHandlePoints,
  hitTestResizeHandle,
  isBoxResizable,
  isLineNode,
  type BoxHandle,
  type LineHandle,
  type ResizeHandle,
} from './resize';
export {
  getNodeBoundsInDoc,
  groupContentBoundsLocal,
  selectionBounds,
  primarySelectionId,
  rotateHandlePoint,
  hitTestRotateHandle,
  applyRotation,
  applyCenterRotation,
  captureRotateOrigins,
  computeRotateDelta,
  aabbCenter,
  getLocalCenter,
  getNodeCenter,
  localToParent,
  parentToLocal,
  flipNodeTransform,
  type RotateOrig,
} from './selection';
export {
  angleFromPivot,
  transformAfterPivotRotate,
  transformAfterCenterFlip,
  normalizeDeg,
  type Vec2,
} from './transformMath';
export { runTransformInvariantChecks, type InvariantResult } from './transformInvariants';
export { bakeInkNodes, type BakeInkResult } from './bakeInk';
export {
  getNodeStrategy,
  strategyHitLocal,
  strategyLocalBounds,
  strategyPaint,
  type NodeStrategy,
} from './nodeStrategies';
export { inkLocalBounds, paintInkStroke, hitInkLocal } from './inkGeometry';
export { alignNodesToFrame, canAlign, type AlignEdge } from './align';
