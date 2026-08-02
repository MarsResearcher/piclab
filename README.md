# PicLab

浏览器里的数字图像暗房与设计工作台。**离线优先**：项目与模板保存在本机 IndexedDB，不是云端模板市场。

## 快速开始

```bash
npm install
npm run dev
```

默认进入 **PicLab Studio** Lite Home：最近项目、三层模板入口。顶栏「主页」可随时返回；上次若停留在编辑器，下次会记住并直接恢复。

## PicLab Studio

| 层级 | 说明 |
|------|------|
| **L1 内置模板** | 仓库内可分解种子（分组、形状、文字原子），见 `src/studio/templates/builtins.ts` |
| **L2 场景生成器** | 参数化画布（名片 / 海报 / 广告等），见 `src/studio/scenes/` |
| **L3 我的模板** | 编辑器顶栏「另存为模板」→ `templateStore`（IndexedDB） |

架构：`model/` · `store/` · `engine/` · `plugins/` · `scenes/` · `templates/` · `export/` — UI 在 `src/ui/studio/`，只通过 store 读写文档。

打印场景（离线几何生成）：田字格 / 拼音格 / 书法竖格·米字格（A4）。导出支持当前面 PNG、全部面 ZIP、多页 PDF（含可选出血）。

```bash
npm run smoke   # 断网关键路径冒烟（场景工厂 + 内置模板）
```

## Lab（Pro+）

`App` 中可进入 **LabApp**：可逆图像实验场。新增实验在 `src/experiments/` 注册到 `experimentRegistry`。

### 新增实验

1. 复制 `src/experiments/template.ts`
2. 实现 `id / name / params / apply(imageData, params)`
3. 在 `src/core/experimentRegistry.ts` 的 `experimentLoaders` 中注册

### 内置实验

| 实验 | 说明 |
|------|------|
| 通道交换 | RGB/HSV 通道任意重映射 |
| 自定义卷积 | 可编辑卷积核 + 预设 |
| 像素排序 | 阈值区间内的 glitch 排序 |
| 频域滤波 | FFT 低通/高通/带通/带阻，附频谱图 |

## 技术栈

- **Canvas 2D** — Studio 主画布与 Lab 预览
- **IndexedDB** — 多项目 + 用户模板持久化
- **Web Workers** — 卷积 / FFT 等重计算预留
