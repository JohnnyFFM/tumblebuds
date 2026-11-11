// Collects every line the game can speak into voice/lines.json (read by make-voice.py).
// Usage: node voice-lines.js   then   python make-voice.py
// ids: m<n> movie lines, o<n> level opening lines, e<n> level ending lines, c_<card> card names.
const fs = require('fs'), path = require('path');
const s = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const grab = (a, b) => { const i = s.indexOf(a) + a.length, j = s.indexOf(b, i); return s.slice(i, j); };
const LTXT = JSON.parse(grab('const LTXT=', '};\nconst LT=') + '}');
const MTXT = (new Function('return ' + grab('const MTXT=', '};') + '}'))();
const TXT = JSON.parse(s.match(/const TXT=(\{.*\});\n/)[1]);
const LANGS = ['en', 'de'];                       // languages that get a voice so far
const BUD = new Set([3, 7, 14, 20, 23, 27, 28, 29, 30]);   // movie lines spoken by the Buds (a child's voice)
const INV = new Set([26]);                        // spoken by the inventor
const SKIP = new Set([15]);                       // text on the signpost, not spoken
const CARDS = { stop: 10, build: 11, dig: 12, bash: 13, float: 14, tramp: 67, jet: 68, run: 69, bomb: 70, bub: 71, climb: 72 };
const out = {};
for (const l of LANGS) {
  const o = out[l] = {};
  MTXT[l].forEach((t, i) => { if (!SKIP.has(i)) o['m' + i] = [t, BUD.has(i) ? 'bud' : INV.has(i) ? 'inv' : 'nar']; });
  LTXT[l].o.forEach((t, i) => { o['o' + i] = [t, 'nar']; });
  LTXT[l].e.forEach((t, i) => { o['e' + i] = [t, 'nar']; });
  for (const k in CARDS) o['c_' + k] = [TXT[l][CARDS[k]], 'bud'];
}
fs.mkdirSync(path.join(__dirname, 'voice'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'voice', 'lines.json'), JSON.stringify(out, null, 1));
console.log(LANGS.map(l => l + ': ' + Object.keys(out[l]).length + ' lines').join(', '));
