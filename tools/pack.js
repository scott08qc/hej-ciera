// Builds a player's private pack from private/<name>_pack.src.json (never committed).
//   node tools/pack.js ciera            -> private/ciera_pack.json (photo paths and credits filled in, stamped)
//   node tools/pack.js ciera --texts    -> prints the Danish lines to record, as a JSON list
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), who = process.argv[2];
const src = JSON.parse(fs.readFileSync(path.join(root, 'private', who + '_pack.src.json'), 'utf8'));
const credits = JSON.parse(fs.readFileSync(path.join(root, 'img', 'credits.json'), 'utf8'));
src.lessons.forEach(l => {
  l.cards = (l.cards || []).filter(c => credits[c.img]).map(c => ({ img: credits[c.img].file, t: c.t, c: c.c, credit: credits[c.img].credit }));
  (l.d || []).forEach(d => { if (!l.p[d[2]]) throw new Error(l.key + ': chat reply index ' + d[2]); });
  l.p.forEach(p => { if (p[0].split(' ').length > 8) throw new Error('too long: ' + p[0]); });
});
if (process.argv.includes('--texts')) {
  const all = new Set();
  src.lessons.forEach(l => [l.p, l.d, l.mix].forEach(list => (list || []).forEach(a => all.add(a[0]))));
  (src.msgs || []).forEach(m => all.add(m.da));
  if (src.welcome) all.add(src.welcome.da);
  process.stdout.write(JSON.stringify([...all]));
} else {
  src.t = Date.now();
  fs.writeFileSync(path.join(root, 'private', who + '_pack.json'), JSON.stringify(src));
  console.log(src.lessons.length, 'lessons,', src.lessons.reduce((n, l) => n + l.p.length, 0), 'phrases,', src.lessons.reduce((n, l) => n + l.cards.length, 0), 'photo cards,', (src.msgs || []).length, 'messages');
}
