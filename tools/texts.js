// Prints every Danish line in index.html (phrases, Kanel's chat lines, mix sentences and story lines) as a JSON list.
//   node tools/texts.js                 lines without a name in them (clips live in this repo)
//   node tools/texts.js --names A,B     only the lines with a name, once per name (clips go to the sync service)
//   node tools/texts.js --missing       only lines that have no clip in audio/f yet
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const body = src.slice(src.indexOf('const UNITS='), src.indexOf('let NAME='));
const L = new Function(body + ';return L')();
const all = new Set();
L.forEach(l => [l.p, l.d, l.mix, l.story].forEach(list => (list || []).forEach(a => all.add(a[0]))));
const slug = t => t.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const i = process.argv.indexOf('--names');
const names = i > 0 ? process.argv[i + 1].split(',') : null;
let out = names
  ? [...all].filter(t => t.includes('{name}')).flatMap(t => names.map(n => t.replace('{name}', n)))
  : [...all].filter(t => !t.includes('{name}'));
if (process.argv.includes('--missing')) out = out.filter(t => !fs.existsSync(path.join(root, 'audio', 'f', slug(t) + '.mp3')));
process.stdout.write(JSON.stringify(out));
