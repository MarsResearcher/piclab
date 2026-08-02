import fs from 'node:fs';

const path = 'src/ui/studio/StudioEditor.tsx';
let t = fs.readFileSync(path, 'utf8');

if (!t.includes("from './uiLabels'")) {
  t = t.replace(
    "import { useStudioProjectSession } from './hooks/useStudioProjectSession';",
    "import { useStudioProjectSession } from './hooks/useStudioProjectSession';\nimport { UI } from './uiLabels';",
  );
}

t = t.replace(/<h3>[^<]*<\/h3>(\s*<\/div>\s*\{doc \?)/, `<h3>{UI.layers}</h3>$1`);
t = t.replace(
  /<p className="hint">[^<]*<\/p>(\s*\)\s*\}\s*<\/aside>)/,
  `<p className="hint">{UI.loading}</p>$1`,
);
t = t.replace(
  /(<header className="panel-header">\s*)<span>[^<]*<\/span>/,
  `$1<span>{UI.props}</span>`,
);

const foot = `<footer className="lab-foot studio-props-foot">
            <span>Del {UI.del}</span>
            <span>Ctrl+D {UI.dup}</span>
            <span>Ctrl+G {UI.group}</span>
            <span>[ ] {UI.layerOrder}</span>
          </footer>`;
t = t.replace(/<footer className="lab-foot[\s\S]*?<\/footer>/, foot);

fs.writeFileSync(path, t, 'utf8');
console.log('wired UI labels');
