import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { ensureStudioFonts } from './studio/fonts/ensureFonts';
import './index.css';
import './ui/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

void ensureStudioFonts();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
