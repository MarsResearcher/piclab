/**
 * Pro+ Laboratory — frozen playground / principle modes.
 * Not the product ROI path; kept for exploration behind Studio.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CanvasManager } from '../core/canvasManager';
import {
  asExperimentResult,
  defaultsFromParams,
  type Experiment,
  type ParamValues,
  type Probe,
} from '../core/experiment';
import { loadPlaygrounds, loadPrinciples } from '../core/experimentRegistry';
import { imageState } from '../core/imageState';
import { FluidStir } from '../core/fluidStir';
import type { AppMode } from '../core/appMode';
import { ModeSwitcher } from './ModeSwitcher';
import { PlayPanel } from './PlayPanel';
import { LearnPanel } from './LearnPanel';
import { ParamsPanel } from './paramsPanel';

const STIR_ID = 'stirPool';

function cloneImageData(source: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
}

type Props = {
  onBack?: () => void;
};

export function LabApp({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const auxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const managerRef = useRef<CanvasManager | null>(null);
  const baseRef = useRef<ImageData | null>(null);
  const playWorkRef = useRef<ImageData | null>(null);
  const stirRef = useRef<FluidStir | null>(null);
  const stirPointerRef = useRef<{ x: number; y: number } | null>(null);
  const stirRafRef = useRef<number | null>(null);
  const previewTimer = useRef<number | null>(null);

  const [appMode, setAppMode] = useState<AppMode>('play');
  const [playgrounds, setPlaygrounds] = useState<Experiment[]>([]);
  const [principles, setPrinciples] = useState<Experiment[]>([]);
  const [active, setActive] = useState<Experiment | null>(null);
  const [params, setParams] = useState<ParamValues>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Pro+ 实验室');
  const [hasImage, setHasImage] = useState(false);
  const [narration, setNarration] = useState('');
  const [auxLabel, setAuxLabel] = useState('原理视窗');
  const [probeNotice, setProbeNotice] = useState('');
  const [activeProbeId, setActiveProbeId] = useState<string | null>(null);
  const [showFineTune, setShowFineTune] = useState(false);
  const [stirRadius, setStirRadius] = useState(60);
  const [stirStrength, setStirStrength] = useState(0.9);
  const [stirViscosity, setStirViscosity] = useState(0.86);

  const isStir = appMode === 'play' && active?.id === STIR_ID;
  const appModeRef = useRef(appMode);
  appModeRef.current = appMode;

  const stopStirLoop = useCallback(() => {
    if (stirRafRef.current !== null) {
      cancelAnimationFrame(stirRafRef.current);
      stirRafRef.current = null;
    }
  }, []);

  const stirFrame = useCallback(() => {
    const stir = stirRef.current;
    const manager = managerRef.current;
    if (!stir || !manager) {
      stirRafRef.current = null;
      return;
    }
    manager.setImageSilent(
      stir.tick(stirPointerRef.current, {
        radius: stirRadius,
        strength: stirStrength,
        viscosity: stirViscosity,
      }),
    );
    stirRafRef.current = requestAnimationFrame(stirFrame);
  }, [stirRadius, stirStrength, stirViscosity]);

  const startStirLoop = useCallback(() => {
    stopStirLoop();
    stirRafRef.current = requestAnimationFrame(stirFrame);
  }, [stirFrame, stopStirLoop]);

  const clearAux = useCallback(() => {
    const aux = auxCanvasRef.current;
    if (!aux) return;
    aux.getContext('2d')?.clearRect(0, 0, aux.width, aux.height);
    aux.dataset.empty = '1';
  }, []);

  const selectExperiment = useCallback(
    (exp: Experiment) => {
      stopStirLoop();
      stirRef.current = null;
      stirPointerRef.current = null;
      setActive(exp);
      clearAux();
      const base = baseRef.current;
      const mode = appModeRef.current;

      if (exp.id === STIR_ID) {
        playWorkRef.current = null;
        setParams(defaultsFromParams(exp.params));
        if (base) {
          stirRef.current = new FluidStir(base);
          managerRef.current?.setImageSilent(stirRef.current.current);
        }
        setStatus('搅动池水');
        return;
      }

      if (mode === 'play' && base) {
        playWorkRef.current = cloneImageData(base);
        managerRef.current?.setImageSilent(playWorkRef.current);
      } else if (base) {
        playWorkRef.current = null;
        imageState.restore(base);
      }

      const first = exp.probes[0];
      if (first) {
        setParams({ ...defaultsFromParams(exp.params), ...first.params });
        setActiveProbeId(first.id);
        setProbeNotice(first.notice);
      } else {
        setParams(defaultsFromParams(exp.params));
        setActiveProbeId(null);
        setProbeNotice(exp.observe[0] ?? '');
      }
      setNarration(exp.principle);
      setStatus(exp.name);
    },
    [clearAux, stopStirLoop],
  );

  useEffect(() => {
    void Promise.all([loadPlaygrounds(), loadPrinciples()]).then(([pg, pr]) => {
      setPlaygrounds(pg);
      setPrinciples(pr);
      if (pg[0]) selectExperiment(pg[0]);
    });
  }, [selectExperiment]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const manager = new CanvasManager(canvas);
    managerRef.current = manager;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      manager.resize(entry.contentRect.width, entry.contentRect.height);
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    const unsub = imageState.subscribe((ev) => {
      if (!stirRef.current) manager.setImage(imageState.imageData);
      setHasImage(!!imageState.imageData);
      void ev;
    });
    return () => {
      ro.disconnect();
      unsub();
      managerRef.current = null;
    };
  }, []);

  const runLearnPreview = useCallback(async () => {
    if (appMode !== 'learn' || !active || !baseRef.current || active.id === STIR_ID) return;
    setBusy(true);
    try {
      const raw = await active.apply(baseRef.current, params);
      const result = asExperimentResult(raw);
      imageState.preview(result.imageData);
      if (result.auxImageData && auxCanvasRef.current) {
        const aux = auxCanvasRef.current;
        aux.width = result.auxImageData.width;
        aux.height = result.auxImageData.height;
        aux.getContext('2d')?.putImageData(result.auxImageData, 0, 0);
        delete aux.dataset.empty;
      }
      if (typeof result.meta?.narration === 'string') setNarration(result.meta.narration);
      if (typeof result.meta?.auxLabel === 'string') setAuxLabel(result.meta.auxLabel);
    } finally {
      setBusy(false);
    }
  }, [active, params, appMode]);

  useEffect(() => {
    if (appMode !== 'learn') return;
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => void runLearnPreview(), 60);
    return () => {
      if (previewTimer.current) window.clearTimeout(previewTimer.current);
    };
  }, [appMode, runLearnPreview]);

  useEffect(() => {
    const manager = managerRef.current;
    if (!manager || !hasImage) return;

    if (isStir) {
      manager.setInteraction({
        onPaint: (_e, info) => {
          stirPointerRef.current = { x: info.x, y: info.y };
          startStirLoop();
          return true;
        },
      });
      const up = () => {
        stirPointerRef.current = null;
      };
      window.addEventListener('pointerup', up);
      return () => {
        manager.setInteraction(null);
        window.removeEventListener('pointerup', up);
      };
    }

    if (appMode === 'play' && active?.interaction?.onPointer) {
      let busyStamp = false;
      manager.setInteraction({
        onPaint: (event, info) => {
          const work = playWorkRef.current;
          if (!work || !active.interaction?.onPointer) return false;
          const stamp = { ...params };
          active.interaction.onPointer(event, info, {
            params: stamp,
            setParam: (k, v) => {
              stamp[k] = v;
            },
          });
          if (busyStamp) return true;
          busyStamp = true;
          void Promise.resolve(active.apply(work, stamp)).then((raw) => {
            const result = asExperimentResult(raw);
            playWorkRef.current = result.imageData;
            managerRef.current?.setImageSilent(result.imageData);
            busyStamp = false;
          });
          return true;
        },
      });
      return () => manager.setInteraction(null);
    }

    manager.setInteraction(null);
  }, [active, params, hasImage, isStir, appMode, startStirLoop]);

  const loadSample = async () => {
    const res = await fetch('/samples/lab-sample.jpg');
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const c = document.createElement('canvas');
    c.width = bitmap.width;
    c.height = bitmap.height;
    c.getContext('2d')!.drawImage(bitmap, 0, 0);
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
    imageState.load(data, 'sample');
    baseRef.current = imageState.getSnapshot();
    managerRef.current?.setImage(imageState.imageData, true);
    if (active) selectExperiment(active);
  };

  const list = appMode === 'play' ? playgrounds : principles;

  return (
    <div className="lab lab-pro">
      <aside className="panel toolbar glass">
        <header className="panel-header lab-panel-head">
          {onBack ? (
            <button type="button" className="btn lab-back-inline" onClick={onBack}>
              {'\u2190 Studio'}
            </button>
          ) : (
            <span className="brand">{'\u5b9e\u9a8c\u5ba4'}</span>
          )}
          <div className="lab-panel-head-meta">
            {onBack && <span className="lab-panel-title">{'\u5b9e\u9a8c\u5ba4'}</span>}
            <span className="brand-sub">pro+</span>
          </div>
        </header>
        <ModeSwitcher
          mode={appMode === 'make' ? 'play' : appMode}
          onChange={(m) => {
            if (m === 'make') return;
            appModeRef.current = m;
            setAppMode(m);
            const first = m === 'play' ? playgrounds[0] : principles[0];
            if (first) selectExperiment(first);
          }}
        />
        <section className="toolbar-group">
          <h3>{appMode === 'play' ? '玩法' : '原理'}</h3>
          <ul>
            {list.map((exp) => (
              <li key={exp.id}>
                <button
                  type="button"
                  className={exp.id === active?.id ? 'active' : ''}
                  onClick={() => selectExperiment(exp)}
                >
                  <span className="exp-name">{exp.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <button type="button" className="btn primary" onClick={() => void loadSample()}>
          载入示例图
        </button>
      </aside>

      <main className="stage">
        <canvas ref={canvasRef} className="main-canvas" />
        <div className="stage-hud glass">
          <span>{status}</span>
          {busy && <span className="pulse">computing</span>}
        </div>
      </main>

      <aside className="panel right glass">
        <header className="panel-header">
          <span>{active?.name ?? '实验'}</span>
          <span className="tag">pro+</span>
        </header>
        {appMode === 'play' && (
          <PlayPanel
            active={active}
            hasImage={hasImage}
            isStir={isStir}
            stirRadius={stirRadius}
            stirStrength={stirStrength}
            stirViscosity={stirViscosity}
            onStirRadius={setStirRadius}
            onStirStrength={setStirStrength}
            onStirViscosity={setStirViscosity}
            onResetStir={() => {
              if (baseRef.current) {
                stirRef.current = new FluidStir(baseRef.current);
                managerRef.current?.setImageSilent(stirRef.current.current);
              }
            }}
            onCommitStir={() => {
              if (!stirRef.current) return;
              imageState.commit(stirRef.current.current, 'stir');
              baseRef.current = imageState.getSnapshot();
            }}
            canCommitPlay={!!playWorkRef.current}
            onCommitPlay={() => {
              if (!playWorkRef.current || !active) return;
              imageState.commit(playWorkRef.current, active.id);
              baseRef.current = imageState.getSnapshot();
            }}
          />
        )}
        {appMode === 'learn' && (
          <LearnPanel
            active={active}
            hasImage={hasImage}
            busy={busy}
            narration={narration}
            auxLabel={auxLabel}
            probeNotice={probeNotice}
            activeProbeId={activeProbeId}
            showFineTune={showFineTune}
            params={params}
            auxCanvasRef={auxCanvasRef}
            onApplyProbe={(probe: Probe) => {
              if (!active) return;
              setParams({ ...defaultsFromParams(active.params), ...probe.params });
              setActiveProbeId(probe.id);
              setProbeNotice(probe.notice);
            }}
            onParamChange={(key, value) => setParams((p) => ({ ...p, [key]: value }))}
            onToggleFineTune={() => setShowFineTune((v) => !v)}
            onCompareHold={() => undefined}
            onCommit={() => void runLearnPreview().then(() => {
              if (imageState.imageData && active) {
                imageState.commit(imageState.imageData, active.id);
                baseRef.current = imageState.getSnapshot();
              }
            })}
          />
        )}
        {showFineTune && active && appMode === 'learn' && (
          <ParamsPanel
            params={active.params}
            values={params}
            onChange={(k, v) => setParams((p) => ({ ...p, [k]: v }))}
          />
        )}
      </aside>
    </div>
  );
}
