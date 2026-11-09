// Prints every Danish line in index.html (phrases and Kanel's chat lines) as a JSON list.
//   node tools/texts.js                 lines without a name in them (clips live in this repo)
//   node tools/texts.js --names A,B     only the lines with a name, once per name (clips go to the sync service)
const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const body = src.slice(src.indexOf('const UNITS='), src.indexOf('let NAME='));
const L = new Function(body + ';return L')();
const all = new Set();
L.forEach(l => { l.p.forEach(p => all.add(p[0])); (l.d || []).forEach(d => all.add(d[0])); });
const i = process.argv.indexOf('--names');
const names = i > 0 ? process.argv[i + 1].split(',') : null;
const out = names
  ? [...all].filter(t => t.includes('{name}')).flatMap(t => names.map(n => t.replace('{name}', n)))
  : [...all].filter(t => !t.includes('{name}'));
process.stdout.write(JSON.stringify(out));
