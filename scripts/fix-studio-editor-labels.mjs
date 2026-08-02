import fs from 'node:fs';

const path = 'src/ui/studio/StudioEditor.tsx';
let s = fs.readFileSync(path, 'utf8');

const reps = [
  ['<h3>??</h3>', '<h3>\u56fe\u5c42</h3>'],
  ['<p className="hint">????</p>', '<p className="hint">\u52a0\u8f7d\u4e2d\u2026</p>'],
  ['{frame.width}?{frame.height}', '{frame.width}\u00d7{frame.height}'],
  ['<span>??</span>', '<span>\u5c5e\u6027</span>'],
];

for (const [a, b] of reps) {
  if (!s.includes(a)) console.log('MISS', JSON.stringify(a));
  else {
    s = s.replace(a, b);
    console.log('OK', a);
  }
}

s = s.replace(
  /<footer className="lab-foot">[\s\S]*?<\/footer>/,
  `<footer className="lab-foot studio-props-foot">
            <span>Del \u5220\u9664</span>
            <span>Ctrl+D \u590d\u5236</span>
            <span>Ctrl+G \u6210\u7ec4</span>
            <span>[ ] \u5c42\u7ea7</span>
          </footer>`,
);

fs.writeFileSync(path, s);
console.log('written');
