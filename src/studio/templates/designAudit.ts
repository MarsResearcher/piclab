/**
 * 审丑引擎 —— 把设计经验固化成可计算的硬逻辑。
 *
 * 无法定义什么是"美"，但可以计算什么是"一定不美"。
 * 本模块把优化链路中积累的经验分级为：
 *   - error：确定性丑（纯数学，零争议）—— 见 DESIGN_GUIDE 中的"必改"项
 *   - warn：统计丑（启发式，高置信度但需人复核）
 *
 * 纯函数：输入 StudioDocument，输出 AuditIssue[]。可在 Node smoke 与浏览器共用。
 */
import {
  isText,
  type FrameNode,
  type SceneNode,
  type StudioDocument,
  type TextNode,
} from '../model';

export type AuditSeverity = 'error' | 'warn';

export type AuditIssue = {
  rule: string;
  severity: AuditSeverity;
  nodeId: string;
  nodeName: string;
  /** 人类可读的说明（含量化值）。 */
  message: string;
};

export type AuditRule = {
  id: string;
  severity: AuditSeverity;
  describe: string;
  /**
   * `node`：对每个可见节点各跑一次（节点级规则）。
   * `frame`：对整个 frame 只跑一次（统计级规则，如字号层级）。
   */
  scope?: 'node' | 'frame';
  /** Return issues; node is the audited node, ctx has doc + helpers. */
  check: (
    node: SceneNode,
    ctx: { doc: StudioDocument; frame: FrameNode; nodes: SceneNode[] },
  ) => string | null;
};

/* ────────────────────────── 计算工具 ────────────────────────── */

function relLuminance(color: string): number | null {
  const m = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(color);
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  let r: number, g: number, b: number;
  if (m) {
    r = Number(m[1]);
    g = Number(m[2]);
    b = Number(m[3]);
  } else if (hex) {
    r = parseInt(hex[1]!.slice(0, 2), 16);
    g = parseInt(hex[1]!.slice(2, 4), 16);
    b = parseInt(hex[1]!.slice(4, 6), 16);
  } else {
    return null; // 渐变 / 命名色 —— 无法量化，跳过
  }
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 对比度（同亮度相减无关，用相对亮度比值）。 */
export function wcagContrast(fg: string, bg: string): number | null {
  const l1 = relLuminance(fg);
  const l2 = relLuminance(bg);
  if (l1 === null || l2 === null) return null;
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function isOnSolidBackdrop(ctx: { doc: StudioDocument; frame: FrameNode; nodes: SceneNode[] }): boolean {
  // 只要 frame 内存在 image 节点，就认为可能是照片背景。
  return !ctx.nodes.some((n) => n.type === 'image' && n.visible);
}

function hasVeilBelow(node: SceneNode, ctx: { doc: StudioDocument; nodes: SceneNode[] }): boolean {
  const order = ctx.nodes;
  const myIdx = order.indexOf(node);
  if (myIdx < 0) return false;
  return order.slice(0, myIdx).some((n) => {
    if (n.type !== 'shape') return false;
    const f = n.fill ?? '';
    // veil = 半透明深色（alpha < 1）的大色块
    return /rgba\(\d+,\s*\d+,\s*\d+,\s*0\.\d+\)/.test(f);
  });
}

/**
 * 文字锚点下方是否有不透明纯色 shape 垫底。
 * 亮字叠纯色块（按钮/标签/侧栏）不是"叠照片"，不触发 accent 规则。
 * 判定：z-order 更低的不透明 shape 的包围盒覆盖文字锚点。
 */
function hasOpaqueBackdropBelow(
  node: SceneNode,
  ctx: { doc: StudioDocument; nodes: SceneNode[] },
): boolean {
  const order = ctx.nodes;
  const myIdx = order.indexOf(node);
  if (myIdx < 0 || !isText(node)) return false;
  const anchor = { x: node.transform.x, y: node.transform.y };
  return order.slice(0, myIdx).some((n) => {
    if (n.type !== 'shape') return false;
    const fill = n.fill ?? '';
    // 半透明 veil 不算"不透明垫底"（可能对比不足）
    if (/rgba\(\d+,\s*\d+,\s*\d+,\s*0\.\d+\)/.test(fill)) return false;
    if (fill === 'transparent' || fill === 'none') return false;
    // 仅矩形/圆角矩形参与（椭圆/多边形投影判断复杂，跳过以避免误判）
    if (n.shape !== 'roundRect' && n.shape !== 'rect') return false;
    const sx = Math.max(0.05, n.transform.scaleX);
    const sy = Math.max(0.05, n.transform.scaleY);
    // makeShape 的 transform.x/y 是左上角，缩放后仍以左上角为原点
    const left = n.transform.x;
    const top = n.transform.y;
    const right = left + n.width * sx;
    const bottom = top + n.height * sy;
    const inX = anchor.x >= left && anchor.x <= right;
    const inY = anchor.y >= top && anchor.y <= bottom;
    return inX && inY;
  });
}

function containsCjk(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

/* ────────────────────────── 规则集 ────────────────────────── */

/**
 * R1 竖排斜体 —— 确定性丑。
 * 竖排用斜体字体（Smiley Sans Oblique 得意黑）字形倾斜发虚。
 */
export const ruleVerticalOblique: AuditRule = {
  id: 'vertical-oblique-font',
  severity: 'error',
  describe: '竖排文字用了斜体字体（字形倾斜发虚）',
  check(node) {
    if (!isText(node) || node.writingMode !== 'vertical') return null;
    if (/oblique/i.test(node.fontFamily) || /smiley sans/i.test(node.fontFamily)) {
      return `竖排字体含斜体：${node.fontFamily}（得意黑竖排会发虚，应换楷书/宋体）`;
    }
    return null;
  },
};

/**
 * R2 优雅衬线被压扁 —— 确定性丑。
 * Playfair 等优雅衬线被 condenseText（scaleX<0.95）破坏字形比例。
 */
export const ruleSerifCondensed: AuditRule = {
  id: 'serif-condensed',
  severity: 'error',
  describe: '优雅衬线被水平压扁（condense 只适合黑体 display）',
  check(node) {
    if (!isText(node)) return null;
    const scaleX = node.transform.scaleX;
    if (scaleX >= 0.95) return null;
    // 排除明确的黑体/无衬线（condense 合法）；Playfair 含 "Playfair" 与 "Display" 但本质是衬线
    if (/sans-serif|sans|hei|黑体|impact|arial\s*black/i.test(node.fontFamily)) return null;
    if (/playfair|serif|georgia|garamond|song|kai|wenkai|xiaowei/i.test(node.fontFamily)) {
      return `衬线字族 ${node.fontFamily} 被 scaleX=${scaleX} 压扁，破坏字形比例（condense 只适合 Bebas/黑体）`;
    }
    return null;
  },
};

/**
 * R3 文本溢出画布 —— 确定性丑。
 * textBounds 超出 frame 边界会被裁切。用纯几何估算（不依赖 canvas，
 * 可在 Node smoke 与浏览器共用）：CJK 字宽≈fontSize，拉丁≈0.62*fontSize，
 * 垂直文本列高≈fontSize*lineHeight。
 */
export const ruleTextOverflow: AuditRule = {
  id: 'text-overflow',
  severity: 'error',
  describe: '文字溢出画布被裁切',
  check(node, ctx) {
    if (!isText(node)) return null;
    const b = estimateTextBounds(node);
    const { x, y } = worldTextBounds(node, b);
    const fw = ctx.frame.width;
    const fh = ctx.frame.height;
    const margin = 8;
    const over =
      (x.max > fw + margin ? `右溢 ${Math.round(x.max - fw)}px` : '') +
      (y.max > fh + margin ? `下溢 ${Math.round(y.max - fh)}px` : '') +
      (x.min < -margin ? `左溢 ${Math.round(-x.min)}px` : '') +
      (y.min < -margin ? `上溢 ${Math.round(-y.min)}px` : '');
    if (!over) return null;
    return `文字 "${node.content.slice(0, 10)}" 溢出画布：${over}`;
  },
};

/** 旋转感知的世界坐标包围盒：把局部文本四角按 scale + rotation 旋转后取 AABB。 */
export function worldTextBounds(
  node: TextNode,
  b: { w: number; h: number; ox: number; oy: number },
): { x: { min: number; max: number }; y: { min: number; max: number } } {
  const rad = (node.transform.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const sx = Math.max(0.05, node.transform.scaleX);
  const sy = Math.max(0.05, node.transform.scaleY);
  const corners = [
    [b.ox * sx, b.oy * sy],
    [(b.ox + b.w) * sx, b.oy * sy],
    [b.ox * sx, (b.oy + b.h) * sy],
    [(b.ox + b.w) * sx, (b.oy + b.h) * sy],
  ] as const;
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const [lx, ly] of corners) {
    const rx = lx * cos - ly * sin;
    const ry = lx * sin + ly * cos;
    const wx = node.transform.x + rx;
    const wy = node.transform.y + ry;
    xMin = Math.min(xMin, wx);
    xMax = Math.max(xMax, wx);
    yMin = Math.min(yMin, wy);
    yMax = Math.max(yMax, wy);
  }
  return {
    x: { min: xMin, max: xMax },
    y: { min: yMin, max: yMax },
  };
}

/** 纯几何文本边界估算（不依赖 canvas）。垂直 = 列中心锚点；水平 = 锚点+字宽。 */
export function estimateTextBounds(node: TextNode): {
  w: number;
  h: number;
  ox: number;
  oy: number;
} {
  const fs = node.fontSize;
  const strokePad = Math.max(0, node.strokeWidth) * 0.5 + 2;
  if (node.writingMode === 'vertical') {
    const lines = node.content.length > 0 ? node.content.split('\n') : [' '];
    const maxChars = Math.max(...lines.map((l) => Array.from(l).length), 1);
    const lh = (node.lineHeight ?? 1.25) * fs;
    const blockH = Math.max(lh * maxChars, fs);
    const colW = fs * 1.05;
    const blockW = Math.max(colW * lines.length, fs);
    return {
      w: blockW + strokePad * 2,
      h: blockH + strokePad * 2,
      ox: -blockW / 2 - strokePad,
      oy: -blockH / 2 - strokePad,
    };
  }
  // 水平：CJK 字符按方块字宽，拉丁/数字按 0.62 宽，空格按 0.3
  const lines = node.content.length > 0 ? node.content.split('\n') : [' '];
  let maxW = 12;
  for (const line of lines) {
    let w = 0;
    for (const ch of Array.from(line)) {
      if (/\s/.test(ch)) w += fs * 0.3;
      else if (/[\u2e80-\u9fff\uff00-\uffef]/.test(ch)) w += fs;
      else w += fs * 0.62;
    }
    maxW = Math.max(maxW, w);
  }
  const lh = (node.lineHeight ?? 1.25) * fs;
  const blockH = Math.max(lh * lines.length, fs);
  const w = maxW + strokePad * 2;
  const h = blockH + strokePad * 2;
  // 水平锚点：left align 起点在 transform.x；center/right 会左移
  let ox = -strokePad;
  if (node.align === 'center') ox = -w / 2;
  else if (node.align === 'right') ox = -w + strokePad;
  return { w, h, ox, oy: -blockH / 2 - strokePad };
}

/**
 * R4 中文正文/小字低于下限 —— 确定性丑（拇指尺寸不可读）。
 * 中文正文 fontSize<20 在缩略图尺寸几乎不可读。
 */
export const ruleTinyCjkText: AuditRule = {
  id: 'tiny-cjk-text',
  severity: 'error',
  describe: '中文小字低于 20px 下限（缩略图不可读）',
  check(node) {
    if (!isText(node)) return null;
    if (!containsCjk(node.content)) return null;
    if (node.fontSize < 20) {
      return `中文 "${node.content.slice(0, 10)}" 字号 ${node.fontSize}px < 20px，拇指尺寸不可读`;
    }
    return null;
  },
};

/**
 * R5 强调色对比度不足 —— 确定性丑。
 * accent 色文字叠在照片亮区（无 halo 保护）时对比度必然不足。
 * 照片像素无法从文档模型获取 → 改为检查"亮色文字在照片上无 halo"。
 */
export const ruleAccentOnPhotoNoHalo: AuditRule = {
  id: 'accent-on-photo-no-halo',
  severity: 'error',
  describe: '亮色 accent 文字直接叠照片且无 halo（对比度不足）',
  check(node, ctx) {
    if (!isText(node)) return null;
    if (node.strokeWidth > 0) return null; // 已有 halo 保护
    const lum = relLuminance(node.color);
    if (lum === null || lum < 0.45) return null; // 深色文字相对安全
    const onPhoto = ctx.nodes.some((n) => n.type === 'image' && n.visible);
    if (!onPhoto) return null;
    const veilBelow = hasVeilBelow(node, ctx);
    if (veilBelow) return null; // 下方有半透明色罩
    const opaqueBelow = hasOpaqueBackdropBelow(node, ctx);
    if (opaqueBelow) return null; // 下方有不透明色块垫底（非照片）
    return `亮色文字 "${node.content.slice(0, 10)}"（lum≈${lum.toFixed(2)}）直接叠照片且无 halo/色罩，对比度可能不足`;
  },
};

/**
 * R6 字号层级缺失 —— 统计丑。
 * 主标题 vs 次大字号 < 2 倍 → 无主次（"胆小的大小差异=平淡"）。
 */
export const ruleHierarchyGap: AuditRule = {
  id: 'hierarchy-gap',
  severity: 'warn',
  scope: 'frame',
  describe: '最大字号/次大字号 < 2，层级平淡',
  check(_node, ctx) {
    const sizes = ctx.nodes
      .filter((n): n is TextNode => n.type === 'text' && n.visible)
      .map((n) => n.fontSize)
      .filter((s) => s >= 12);
    const uniq = Array.from(new Set(sizes)).sort((a, b) => b - a);
    if (uniq.length < 2) return null;
    const ratio = uniq[0]! / uniq[1]!;
    if (ratio < 1.9) {
      return `最大字号 ${uniq[0]} / 次大 ${uniq[1]} = ${ratio.toFixed(2)} < 2，主次不分明`;
    }
    return null;
  },
};

/**
 * R7 字号档数过多 —— 统计丑。
 * 一屏 >4 档字号 → 阅读路径混乱。
 */
export const ruleTooManySizeSteps: AuditRule = {
  id: 'too-many-size-steps',
  severity: 'warn',
  scope: 'frame',
  describe: '字号档数 > 4，阅读路径混乱',
  check(_node, ctx) {
    const sizes = ctx.nodes
      .filter((n): n is TextNode => n.type === 'text' && n.visible)
      .map((n) => Math.round(n.fontSize));
    const steps = new Set(sizes).size;
    if (steps > 4) {
      return `共 ${steps} 档字号（${Array.from(new Set(sizes)).sort((a, b) => b - a).join('/')}），层级过散`;
    }
    return null;
  },
};

/**
 * R8 halo 滥用 —— 统计丑。
 * 纯色面板上的文字（无照片背景）用了 halo（strokeWidth>0）显得业余。
 */
export const ruleHaloOnSolidBackdrop: AuditRule = {
  id: 'halo-on-solid-backdrop',
  severity: 'warn',
  describe: '纯色背景上的文字用了描边（halo 只用于照片可读性）',
  check(node, ctx) {
    if (!isText(node)) return null;
    if (node.strokeWidth <= 0) return null;
    if (!isOnSolidBackdrop(ctx)) return null;
    if (/rect|panel|排版板|底板/.test(node.name)) return null;
    return `文字 "${node.content.slice(0, 10)}" 在纯色背景上使用 strokeWidth=${node.strokeWidth}（halo 只该出现在照片上）`;
  },
};

/**
 * R9 竖排 x 未对齐 —— 统计丑。
 * 竖排列中心 x 应为 轴 + fontSize/2 的近似（常见错误：忘了 +fontSize/2）。
 */
export const ruleVerticalXUnanchored: AuditRule = {
  id: 'vertical-x-unanchored',
  severity: 'warn',
  describe: '竖排文字 x 与左轴无对位关系（可能忘了 +fontSize/2）',
  check(node) {
    if (!isText(node) || node.writingMode !== 'vertical') return null;
    const x = node.transform.x;
    // 无法知道模板的 M，改用启发式：x 是否大致落在 列中心语义。
    // 若 x 接近整数且非轴对位特征 → 提示复核。
    if (Math.abs(x - Math.round(x)) < 0.01) return null; // x 本身规整，可能是有意
    return `竖排文字 x=${x} 非常规值，检查是否应为 "轴 + fontSize/2"（列中心语义）`;
  },
};

/**
 * R10 竖排斜体已按 R1 覆盖；R10 改为：多个竖排列并行时列距过大。
 * 简化：跳过（R1 已捕获主要问题）。
 */

export const AUDIT_RULES: AuditRule[] = [
  ruleVerticalOblique,
  ruleSerifCondensed,
  ruleTextOverflow,
  ruleTinyCjkText,
  ruleAccentOnPhotoNoHalo,
  ruleHierarchyGap,
  ruleTooManySizeSteps,
  ruleHaloOnSolidBackdrop,
  ruleVerticalXUnanchored,
];

/** 收集 frame 内所有后代节点（渲染顺序 = 父 frame children 顺序）。 */
function frameNodes(doc: StudioDocument, frame: FrameNode): SceneNode[] {
  const out: SceneNode[] = [];
  const visit = (id: string) => {
    const n = doc.nodes[id];
    if (!n) return;
    out.push(n);
    if (n.type === 'frame' || n.type === 'group') {
      for (const cid of n.children) visit(cid);
    }
  };
  for (const cid of frame.children) visit(cid);
  return out;
}

/** 对单个 frame 运行全部规则。 */
export function auditFrame(doc: StudioDocument, frame: FrameNode): AuditIssue[] {
  const nodes = frameNodes(doc, frame);
  const ctx = { doc, frame, nodes };
  const issues: AuditIssue[] = [];
  const pushIssue = (
    rule: AuditRule,
    node: SceneNode,
    msg: string,
  ): void => {
    issues.push({
      rule: rule.id,
      severity: rule.severity,
      nodeId: node.id,
      nodeName: node.name,
      message: msg,
    });
  };
  // frame 级规则：对整个 frame 跑一次（挂在 frame 节点上）
  for (const rule of AUDIT_RULES) {
    if (rule.scope !== 'frame') continue;
    const msg = rule.check(frame, ctx);
    if (msg) pushIssue(rule, frame, msg);
  }
  // node 级规则：每个可见节点各跑一次
  for (const node of nodes) {
    if (!node.visible) continue;
    for (const rule of AUDIT_RULES) {
      if (rule.scope === 'frame') continue;
      const msg = rule.check(node, ctx);
      if (msg) pushIssue(rule, node, msg);
    }
  }
  return issues;
}

/** 对文档全部 frame 运行。 */
export function auditDocument(doc: StudioDocument): AuditIssue[] {
  const issues: AuditIssue[] = [];
  for (const page of doc.pages) {
    for (const fid of page.frameIds) {
      const frame = doc.nodes[fid];
      if (frame?.type === 'frame') issues.push(...auditFrame(doc, frame));
    }
  }
  return issues;
}

/** 汇总统计。 */
export function summarizeIssues(issues: AuditIssue[]): {
  errors: AuditIssue[];
  warnings: AuditIssue[];
  total: number;
} {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warn');
  return { errors, warnings, total: issues.length };
}
