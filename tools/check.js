// Run before every publish: node tools/check.js
// Fails (exit 1) if the page script does not parse, the course content is malformed, or a voice clip is missing.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const problems = [];
try { new Function(src.slice(src.indexOf('<script>') + 8, src.lastIndexOf('</script>'))); } catch (e) { problems.push('page script does not parse: ' + e.message); }
const L = new Function(src.slice(src.indexOf('const UNITS='), src.indexOf('let NAME=')) + ';return L')();
const slug = t => t.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const keys = L.map(l => l.key).filter(Boolean);
keys.filter((k, i) => keys.indexOf(k) !== i).forEach(k => problems.push('duplicate key ' + k));
// The first twelve lessons are identified by position in saved progress, so they must stay first and keyless.
L.slice(0, 12).forEach((l, i) => { if (l.key || !l.p) problems.push('lesson ' + i + ' must stay a keyless lesson in its original place'); });
L.slice(12).forEach((l, i) => { if (!l.key) problems.push('lesson at position ' + (i + 12) + ' needs a key'); });
let lines = 0, missing = 0;
L.forEach(l => {
  const id = l.key || l.t;
  (l.p || []).forEach(p => { if (p[0].split(' ').length > 8) problems.push(id + ': over 8 words: ' + p[0]); if (!p[1] || !p[2]) problems.push(id + ': missing meaning or hint: ' + p[0]); });
  (l.d || []).forEach(d => { if (!(l.p || [])[d[2]]) problems.push(id + ': chat reply index ' + d[2]); });
  (l.q || []).forEach(q => { if (!q[1][q[2]]) problems.push(id + ': quiz answer index'); });
  if (!l.p && !l.story) problems.push(id + ': neither a lesson nor a story');
  [l.p, l.d, l.mix, l.story].forEach(list => (list || []).forEach(a => {
    if (a[0].includes('{name}')) return;
    lines++;
    for (const w of ['f', 'm']) { const f = path.join(root, 'audio', w, slug(a[0]) + '.mp3'); if (!fs.existsSync(f) || fs.statSync(f).size < 1500) { missing++; problems.push('no clip ' + w + ': ' + a[0]); } }
  }));
});
// Nothing private may be in the public files.
for (const f of ['index.html', 'sw.js']) if (/admin-key|x-admin-key/i.test(fs.readFileSync(path.join(root, f), 'utf8'))) problems.push(f + ' mentions the admin key');
console.log(`${L.filter(l => l.p).length} lessons, ${L.filter(l => l.story).length} stories, ${lines} voiced lines, ${missing} missing clips`);
if (problems.length) { console.log(problems.slice(0, 30).join('\n')); process.exit(1); }
console.log('all checks passed');
