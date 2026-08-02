/**
 * Studio font catalog — bundled OFL faces first (free commercial),
 * then web-safe / system CJK stacks as fallbacks.
 */

export type FontRole =
  | 'display'
  | 'script'
  | 'serif'
  | 'body'
  | 'meta'
  | 'latin'
  | 'mono';

export type FontOption = {
  value: string;
  label: string;
  /** Short preview line for UI */
  sample?: string;
  /** Design role hint for editors */
  role?: FontRole;
  /** Bundled OFL / free-commercial face (offline). */
  bundled?: boolean;
  /** License hint shown in picker */
  license?: 'OFL' | 'system';
};

/** Group labels for <optgroup> in font pickers. */
export const FONT_ROLE_GROUPS: { role: FontRole; label: string }[] = [
  { role: 'display', label: '标题 · 展示' },
  { role: 'script', label: '手写 · 书法' },
  { role: 'serif', label: '衬线 · 编辑' },
  { role: 'latin', label: '西文特色' },
  { role: 'body', label: '正文 · 信息' },
  { role: 'meta', label: '元数据' },
  { role: 'mono', label: '等宽 · 编号' },
];

export const STUDIO_FONT_CATALOG: FontOption[] = [
  // ═══════════════════════════════════════════
  // Bundled OFL — free commercial (preferred)
  // ═══════════════════════════════════════════

  // —— Display / 标题 ——
  {
    value: '"ZCOOL KuaiLe", "YouYuan", "PingFang SC", sans-serif',
    label: '站酷快乐体 · 圆趣',
    sample: '周末市集',
    role: 'display',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"ZCOOL QingKe HuangYou", "YouYuan", "PingFang SC", sans-serif',
    label: '站酷黄油体 · 圆润',
    sample: '限时开放',
    role: 'display',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"ZCOOL XiaoWei", "Songti SC", "Noto Serif SC", serif',
    label: '站酷小薇 · 典雅',
    sample: '山野纪行',
    role: 'display',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Smiley Sans Oblique", "Microsoft YaHei", "PingFang SC", sans-serif',
    label: '得意黑 · 斜体海报',
    sample: '醒目主张',
    role: 'display',
    bundled: true,
    license: 'OFL',
  },

  // —— Script / 书法手写 ——
  {
    value: '"LXGW WenKai", "KaiTi", "STKaiti", serif',
    label: '霞鹜文楷 · 文艺',
    sample: '在山野',
    role: 'script',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Ma Shan Zheng", "KaiTi", "STXingkai", serif',
    label: '马善政楷书 · 书法',
    sample: '听风看云',
    role: 'script',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Long Cang", "STXingkai", "KaiTi", serif',
    label: '龙藏体 · 笔墨',
    sample: '江河湖海',
    role: 'script',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Zhi Mang Xing", "STXingkai", "KaiTi", serif',
    label: '志莽行书 · 行草',
    sample: '奔赴山海',
    role: 'script',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Liu Jian Mao Cao", "STXingkai", "KaiTi", cursive',
    label: '刘建毛草 · 毛边',
    sample: '随手一记',
    role: 'script',
    bundled: true,
    license: 'OFL',
  },

  // —— Serif / 编辑 (bundled latin + system song) ——
  {
    value: '"Playfair Display", "Songti SC", "Noto Serif SC", serif',
    label: 'Playfair · 时尚衬线',
    sample: 'Atelier',
    role: 'serif',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"DM Serif Display", "Songti SC", Georgia, serif',
    label: 'DM Serif · 杂志',
    sample: 'Gallery',
    role: 'serif',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Cormorant Garamond", "Songti SC", Garamond, serif',
    label: 'Cormorant · 书卷',
    sample: 'Fine print',
    role: 'serif',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Instrument Serif", "Songti SC", Georgia, serif',
    label: 'Instrument · 当代编辑',
    sample: 'Editorial',
    role: 'serif',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Libre Baskerville", "Songti SC", Baskerville, serif',
    label: 'Libre Baskerville · 报刊',
    sample: 'Classic',
    role: 'serif',
    bundled: true,
    license: 'OFL',
  },

  // —— Latin display ——
  {
    value: '"Bebas Neue", Impact, "Arial Narrow", sans-serif',
    label: 'Bebas Neue · 窄体海报',
    sample: 'MOUNTAINS',
    role: 'latin',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Anton", "Arial Black", Impact, sans-serif',
    label: 'Anton · 厚重冲击',
    sample: 'BOLD',
    role: 'latin',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Archivo Black", "Arial Black", Impact, sans-serif',
    label: 'Archivo Black · 超粗',
    sample: 'OPEN',
    role: 'latin',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Oswald", "Arial Narrow", "Helvetica Neue", sans-serif',
    label: 'Oswald · 紧排标题',
    sample: 'NARROW TYPE',
    role: 'latin',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif',
    label: 'Space Grotesk · 几何',
    sample: 'STUDIO',
    role: 'latin',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
    label: 'Montserrat · 几何标题',
    sample: 'EVENT',
    role: 'latin',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Outfit", "PingFang SC", "Helvetica Neue", sans-serif',
    label: 'Outfit · 现代圆角',
    sample: 'Modern',
    role: 'latin',
    bundled: true,
    license: 'OFL',
  },

  // —— Body (bundled) ——
  {
    value: '"LXGW WenKai", "PingFang SC", "Microsoft YaHei", serif',
    label: '霞鹜文楷 · 可读正文',
    sample: '清晰易读',
    role: 'body',
    bundled: true,
    license: 'OFL',
  },
  {
    value: '"Outfit", "PingFang SC", "Microsoft YaHei", sans-serif',
    label: 'Outfit · 信息栏',
    sample: '电话邮箱',
    role: 'body',
    bundled: true,
    license: 'OFL',
  },

  // ═══════════════════════════════════════════
  // System stacks — device-dependent
  // ═══════════════════════════════════════════

  // —— Display ——
  {
    value: 'SimHei, "Heiti SC", "PingFang SC", "Noto Sans SC", sans-serif',
    label: '黑体 · 醒目标题',
    sample: '醒目巨字',
    role: 'display',
    license: 'system',
  },
  {
    value: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
    label: '雅黑粗 · 海报',
    sample: '限时开放',
    role: 'display',
    license: 'system',
  },
  {
    value: '"YouYuan", "Yuanti SC", "PingFang SC", sans-serif',
    label: '幼圆 · 圆润标题',
    sample: '柔软主张',
    role: 'display',
    license: 'system',
  },
  {
    value: '"STXinwei", "STHupo", "Xingkai SC", "KaiTi", serif',
    label: '新魏 / 琥珀 · 个性',
    sample: '山野纪行',
    role: 'display',
    license: 'system',
  },
  {
    value: '"STCaiyun", "YouYuan", "Yuanti SC", sans-serif',
    label: '彩云 · 装饰标题',
    sample: '云上展',
    role: 'display',
    license: 'system',
  },

  // —— Script ——
  {
    value: '"KaiTi", "STKaiti", "Kaiti SC", "KaiTi_GB2312", serif',
    label: '楷体 · 系统手写感',
    sample: '在山野',
    role: 'script',
    license: 'system',
  },
  {
    value: '"STXingkai", "Xingkai SC", "KaiTi", "STKaiti", serif',
    label: '行楷 · 系统潇洒',
    sample: '听风看云',
    role: 'script',
    license: 'system',
  },
  {
    value: 'LiSu, "STLiti", "Baoli SC", "KaiTi", serif',
    label: '隶书 · 金石',
    sample: '篆刻意味',
    role: 'script',
    license: 'system',
  },
  {
    value: '"Segoe Print", "Comic Sans MS", "KaiTi", cursive',
    label: '手写西文 · 便签',
    sample: 'hand note',
    role: 'script',
    license: 'system',
  },
  {
    value: '"Brush Script MT", "Segoe Script", "KaiTi", cursive',
    label: 'Brush · 笔触',
    sample: 'Signature',
    role: 'script',
    license: 'system',
  },
  {
    value: '"Lucida Handwriting", "Segoe Script", "KaiTi", cursive',
    label: 'Lucida · 花体',
    sample: 'Dear friend',
    role: 'script',
    license: 'system',
  },

  // —— Serif ——
  {
    value: 'SimSun, "Songti SC", "STSong", "Noto Serif SC", serif',
    label: '宋体 · 编辑正文',
    sample: '把目光放远',
    role: 'serif',
    license: 'system',
  },
  {
    value: '"FangSong", "STFangsong", "FangSong_GB2312", serif',
    label: '仿宋 · 雅致说明',
    sample: '展讯说明',
    role: 'serif',
    license: 'system',
  },
  {
    value: 'Georgia, Palatino, "Palatino Linotype", "Songti SC", serif',
    label: 'Georgia · 西文衬线',
    sample: 'Classic quote',
    role: 'serif',
    license: 'system',
  },
  {
    value: 'Garamond, "Palatino Linotype", Georgia, "Songti SC", serif',
    label: 'Garamond · 书卷',
    sample: 'Fine print',
    role: 'serif',
    license: 'system',
  },
  {
    value: '"Times New Roman", Times, "Songti SC", serif',
    label: 'Times · 报刊',
    sample: 'Editorial',
    role: 'serif',
    license: 'system',
  },
  {
    value: 'Baskerville, "Palatino Linotype", Georgia, serif',
    label: 'Baskerville · 典雅',
    sample: 'Gallery',
    role: 'serif',
    license: 'system',
  },

  // —— Latin system ——
  {
    value:
      'Impact, "Arial Black", "Helvetica Neue", "PingFang SC", sans-serif',
    label: 'Impact · 窄体海报',
    sample: 'MOUNTAINS',
    role: 'latin',
    license: 'system',
  },
  {
    value: 'Arial Black, Impact, "Helvetica Neue", Arial, sans-serif',
    label: 'Arial Black · 厚重',
    sample: 'BOLD',
    role: 'latin',
    license: 'system',
  },
  {
    value: '"Century Gothic", "Futura", "Gill Sans", Arial, sans-serif',
    label: 'Gothic · 几何无衬线',
    sample: 'OPEN',
    role: 'latin',
    license: 'system',
  },
  {
    value: '"Trebuchet MS", "Segoe UI", Arial, sans-serif',
    label: 'Trebuchet · 活动',
    sample: 'Event',
    role: 'latin',
    license: 'system',
  },
  {
    value: '"Gill Sans", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif',
    label: 'Gill Sans · 人文',
    sample: 'Atelier',
    role: 'latin',
    license: 'system',
  },
  {
    value: 'Copperplate, "Copperplate Gothic Light", "PingFang SC", serif',
    label: 'Copperplate · 镌刻',
    sample: 'EST. 1998',
    role: 'latin',
    license: 'system',
  },
  {
    value: '"Arial Narrow", Arial, "Helvetica Neue", sans-serif',
    label: 'Arial Narrow · 紧排',
    sample: 'NARROW TYPE',
    role: 'latin',
    license: 'system',
  },
  {
    value: 'Arial, Helvetica, "PingFang SC", sans-serif',
    label: 'Arial · 干净西文',
    sample: 'OPEN HOUSE',
    role: 'latin',
    license: 'system',
  },

  // —— Body ——
  {
    value: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
    label: '苹方 / 雅黑 · 正文',
    sample: '清晰易读',
    role: 'body',
    license: 'system',
  },
  {
    value: '"Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", sans-serif',
    label: '雅黑 UI · 信息栏',
    sample: '电话邮箱',
    role: 'body',
    license: 'system',
  },

  // —— Meta / mono ——
  {
    value: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    label: '系统 UI · 元数据',
    sample: 'VOL. 03',
    role: 'meta',
    license: 'system',
  },
  {
    value: '"Courier New", Consolas, "Sarasa Mono SC", monospace',
    label: '等宽 · 编号',
    sample: 'NO.08',
    role: 'mono',
    license: 'system',
  },
  {
    value: 'Consolas, "Cascadia Mono", "Courier New", monospace',
    label: 'Consolas · 代码感',
    sample: '0xFF',
    role: 'mono',
    license: 'system',
  },
];

/** Default body face (index kept stable for DEFAULT_TEXT_STYLE). */
export const DEFAULT_STUDIO_FONT =
  STUDIO_FONT_CATALOG.find((f) => f.bundled && f.role === 'body')?.value ??
  STUDIO_FONT_CATALOG.find((f) => f.role === 'body')?.value ??
  STUDIO_FONT_CATALOG[0]!.value;

/** Pass-through if already a stack; otherwise fall back to default. */
export function resolveStudioFont(family: string): string {
  if (!family) return DEFAULT_STUDIO_FONT;
  if (STUDIO_FONT_CATALOG.some((f) => f.value === family)) return family;
  // Allow template-authored stacks that contain known face names.
  return family;
}

export function fontsByRole(role: FontRole): FontOption[] {
  return STUDIO_FONT_CATALOG.filter((f) => f.role === role);
}
