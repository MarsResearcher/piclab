/**
 * Canvas content defaults — independent from UI chrome accent.
 * Inserted shapes / text / ink should look like editable materials, not brand chips.
 */

export const contentDefaults = {
  /** Soft slate block fill for rect / roundRect / star / arrow. */
  shapeFill: '#3D4450',
  /** Mist blue — distinct ellipse hue. */
  ellipseFill: '#6B8CAE',
  /** Warm sand triangle. */
  triangleFill: '#D4A574',
  /** Paper-white stroke for lines. */
  lineStroke: '#E8E4D8',
  lineStrokeWidth: 4,
  /** Near-invisible warm stroke when a stroke is required. */
  shapeStroke: '#000000',
  shapeStrokeWidth: 0,
  /** Warm paper text on dark artboards. */
  textColor: '#F4F0E8',
  textStroke: '#000000',
  textStrokeWidth: 0,
  /** Charcoal ink (not UI accent). */
  inkStroke: '#1C1A17',
  inkStrokeWidth: 4,
  /** Deep slate background plate. */
  backgroundFill: '#1A1D24',
  /**
   * Template / scene emphasis — content brand, independent of UI signal teal.
   */
  brandBar: '#5B9CF5',
  /** Secondary content accent (badges, small fills). */
  brandBarMuted: '#4A86DB',
} as const;

export type ContentDefaults = typeof contentDefaults;
