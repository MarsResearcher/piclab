/**
 * Canvas chrome colors — Graphite Studio.
 * Keep in sync with `:root` in `src/ui/styles.css`.
 *
 * Selection uses the UI signal accent; stage checker is cool graphite.
 */
export const themeColors = {
  selection: '#34D3C0',
  selectionFill: 'rgba(52, 211, 192, 0.16)',
  /** Guides: soft amber — secondary, not competing with selection teal */
  guides: '#E8B86D',
  checkerA: '#0c0c0f',
  checkerB: '#141418',
  viewportFallback: '#09090b',
} as const;
