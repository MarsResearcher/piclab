import fs from 'fs';
const p = 'src/ui/studio/StudioCanvasChrome.tsx';
let t = fs.readFileSync(p, 'utf8');
const pairs = [
  ['title="Zoom out"', 'title="\u7f29\u5c0f"'],
  ['title="Reset 100%"', 'title="\u91cd\u7f6e 100%"'],
  ['title="Zoom in"', 'title="\u653e\u5927"'],
  ['title="Fit"', 'title="\u9002\u5e94"'],
];
for (const [a, b] of pairs) t = t.replace(a, b);
fs.writeFileSync(p, t);
console.log('ok');
