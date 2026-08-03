import { useState } from 'react';
import JSZip from 'jszip';
import { PLATFORM_GROUPS, coverCrop } from '../tools/platformPresets';
import { formatBytes } from '../tools/exportImage';

type Props = {
  imageData: ImageData | null;
  onClose: () => void;
};

type SelectedMap = Record<string, boolean>;

export function BatchExportPanel({ imageData, onClose }: Props) {
  const [selected, setSelected] = useState<SelectedMap>(() => {
    const init: SelectedMap = {};
    for (const g of PLATFORM_GROUPS) {
      for (const p of g.presets) init[p.id] = false;
    }
    return init;
  });
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [quality, setQuality] = useState(0.9);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  const toggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectGroup = (groupId: string, on: boolean) => {
    const g = PLATFORM_GROUPS.find((x) => x.id === groupId);
    if (!g) return;
    setSelected((prev) => {
      const next = { ...prev };
      for (const p of g.presets) next[p.id] = on;
      return next;
    });
  };

  const count = Object.values(selected).filter(Boolean).length;

  const run = async () => {
    if (!imageData || count === 0) return;
    setBusy(true);
    const zip = new JSZip();
    const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    const ext = format === 'jpeg' ? 'jpg' : format;
    let done = 0;

    for (const group of PLATFORM_GROUPS) {
      for (const preset of group.presets) {
        if (!selected[preset.id]) continue;
        setProgress(`处理 ${group.name} · ${preset.name}…`);
        const resized = coverCrop(imageData, preset.width, preset.height);
        const c = document.createElement('canvas');
        c.width = preset.width;
        c.height = preset.height;
        c.getContext('2d')!.putImageData(resized, 0, 0);
        const blob = await new Promise<Blob>((resolve, reject) => {
          c.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
            mime,
            format === 'png' ? undefined : quality,
          );
        });
        zip.file(`${group.id}/${preset.name}-${preset.width}x${preset.height}.${ext}`, blob);
        done++;
      }
    }

    setProgress('打包 ZIP…');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = `piclab-platforms-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
    setBusy(false);
    setProgress(`完成 · ${done} 张 · ${formatBytes(zipBlob.size)}`);
  };

  return (
    <div className="batch-panel glass">
      <header>
        <span>批量导出 · 平台尺寸</span>
        <button type="button" className="close" onClick={onClose}>
          ×
        </button>
      </header>

      <div className="batch-groups">
        {PLATFORM_GROUPS.map((group) => (
          <div key={group.id} className="batch-group">
            <div className="batch-group-head">
              <span>{group.name}</span>
              <div className="batch-group-actions">
                <button type="button" onClick={() => selectGroup(group.id, true)}>
                  全
                </button>
                <button type="button" onClick={() => selectGroup(group.id, false)}>
                  无
                </button>
              </div>
            </div>
            <div className="batch-presets">
              {group.presets.map((preset) => (
                <label key={preset.id} className={selected[preset.id] ? 'on' : ''}>
                  <input
                    type="checkbox"
                    checked={!!selected[preset.id]}
                    onChange={() => toggle(preset.id)}
                  />
                  <span className="pname">{preset.name}</span>
                  <span className="psize">
                    {preset.width}×{preset.height}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="batch-controls">
        <label>
          <span>格式</span>
          <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </label>
        {format !== 'png' && (
          <label>
            <span>质量 {Math.round(quality * 100)}%</span>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.01}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
          </label>
        )}
      </div>

      <button
        type="button"
        className="btn primary"
        disabled={!imageData || count === 0 || busy}
        onClick={() => void run()}
      >
        {busy ? '处理中…' : `导出 ${count} 张（打包 ZIP）`}
      </button>
      {progress && <p className="batch-progress">{progress}</p>}
    </div>
  );
}
