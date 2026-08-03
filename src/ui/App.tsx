import { useState } from 'react';
import { StudioEditor } from './studio/StudioEditor';
import { LabApp } from './LabApp';

const LANDING_KEY = 'piclab-studio-landing';

/**
 * Product shell: Studio (scenes) is default.
 * Play/Learn live as LabApp — frozen experimental playground, no new features.
 */
export function App() {
  const [surface, setSurface] = useState<'studio' | 'lab'>('studio');
  const [studioLanding, setStudioLanding] = useState<'home' | 'editor'>(() => {
    if (typeof window === 'undefined') return 'home';
    return window.localStorage.getItem(LANDING_KEY) === 'editor' ? 'editor' : 'home';
  });

  if (surface === 'lab') {
    return (
      <div className="lab-surface">
        <LabApp onBack={() => setSurface('studio')} />
      </div>
    );
  }

  return (
    <StudioEditor
      landing={studioLanding}
      onLandingChange={(next) => {
        setStudioLanding(next);
        window.localStorage.setItem(LANDING_KEY, next);
      }}
      onOpenLab={() => setSurface('lab')}
    />
  );
}
