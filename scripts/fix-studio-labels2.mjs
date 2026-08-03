import fs from 'node:fs';

const path = 'src/ui/studio/StudioEditor.tsx';
let t = fs.readFileSync(path, 'utf8');

const h3 = t.match(/block-head>\s*<h3>([^<]*)<\/h3>/);
console.log('h3 before', h3?.[1], [...(h3?.[1] ?? '')].map((c) => c.codePointAt(0).toString(16)));

// Force-replace known broken spots with unicode escapes (always rewrite).
t = t.replace(
  /(<div className="block-head">\s*)<h3>[^<]*<\/h3>/,
  `$1<h3>${'\u56fe\u5c42'}</h3>`,
);
t = t.replace(
  /<p className="hint">[^<]*<\/p>(\s*\)\s*}\s*<\/aside>)/,
  `<p className="hint">${'\u52a0\u8f7d\u4e2d\u2026'}</p>$1`,
);
t = t.replace(
  /\{frame\.width\}.[\{]?frame\.height\}/,
  '{frame.width}\u00d7{frame.height}',
);
// more precise for width×height
t = t.replace(
  /\{frame\.width\}[^\{{\n]{1,3}\{frame\.height\}/,
  '{frame.width}\u00d7{frame.height}',
);
t = t.replace(
  /(<header className="panel-header">\s*)<span>[^<]*<\/span>/,
  `$1<span>${'\u5c5e\u6027'}</span>`,
);

const foot = `<footer className="lab-foot studio-props-foot">
            <span>Del ${'\u5220\u9664'}</span>
            <span>Ctrl+D ${'\u590d\u5236'}</span>
            <span>Ctrl+G ${'\u6210\u7ec4'}</span>
            <span>[ ] ${'\u5c42\u7ea7'}</span>
          </footer>`;
t = t.replace(/<footer className="lab-foot[\s\S]*?<\/footer>/, foot);

fs.writeFileSync(path, t, 'utf8');

const t2 = fs.readFileSync(path, 'utf8');
const h32 = t2.match(/block-head>\s*<h3>([^<]*)<\/h3>/);
console.log('h3 after', h32?.[1], [...(h32?.[1] ?? '')].map((c) => c.codePointAt(0).toString(16)));
const f2 = t2.match(/studio-props-foot>[\s\S]*?<\/footer>/);
console.log('foot after', JSON.stringify(f2?.[0]?.slice(0, 160)));
