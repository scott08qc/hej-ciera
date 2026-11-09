// Prints every Danish line in index.html (phrases and Kanel's chat lines) as a JSON list.
const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const body = src.slice(src.indexOf('const UNITS='), src.indexOf('L.forEach('));
const L = new Function(body + ';return L')();
const out = new Set();
L.forEach(l => { l.p.forEach(p => out.add(p[0])); (l.d || []).forEach(d => out.add(d[0])); });
process.stdout.write(JSON.stringify([...out]));
