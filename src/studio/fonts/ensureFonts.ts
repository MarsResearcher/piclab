import './bundled.css';

let ready: Promise<void> | null = null;

/** Families we ship under /public/fonts (OFL, commercial-ok). */
export const BUNDLED_FONT_FAMILIES = [
  'ZCOOL KuaiLe',
  'ZCOOL XiaoWei',
  'ZCOOL QingKe HuangYou',
  'Smiley Sans Oblique',
  'Ma Shan Zheng',
  'Long Cang',
  'Zhi Mang Xing',
  'Liu Jian Mao Cao',
  'LXGW WenKai',
  'Bebas Neue',
  'Anton',
  'Archivo Black',
  'Oswald',
  'Playfair Display',
  'DM Serif Display',
  'Cormorant Garamond',
  'Space Grotesk',
  'Montserrat',
  'Libre Baskerville',
  'Outfit',
  'Instrument Serif',
  'Caveat',
  'Patrick Hand',
] as const;

/**
 * Load bundled @font-face files so canvas measureText / fillText
 * use real metrics instead of fallback system faces.
 */
export function ensureStudioFonts(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    if (typeof document === 'undefined' || !document.fonts?.load) return;
    const loads = BUNDLED_FONT_FAMILIES.flatMap((family) => [
      document.fonts.load(`400 48px "${family}"`),
      document.fonts.load(`700 48px "${family}"`),
    ]);
    await Promise.allSettled(loads);
    await document.fonts.ready;
  })();
  return ready;
}
