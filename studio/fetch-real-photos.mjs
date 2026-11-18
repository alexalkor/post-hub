// Fetches a few REAL, openly licensed iPhone photos from Wikimedia Commons into catalog/real-iphones/ (not in Git: see .gitignore),
// cuts them out (transparent PNG, trimmed) and writes product.js with the licence and author of every picture.
//   node studio/fetch-real-photos.mjs
// Why not in Git: the pictures are other people's work under CC BY / CC BY-SA / CC0. Re-run this script to get them again; attribution is written to
// catalog/real-iphones/ATTRIBUTION.md. Texts and specs are copied from the simulated demo catalog (still demo values).
// Only photos that already have a transparent background are used (the retail-shelf photos of the 17 Pro Max were rejected: busy background).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), here = path.join(root, 'studio');
const out = path.join(root, 'catalog', 'real-iphones'), demo = path.join(root, 'catalog', 'demo-iphones');
const UA = { 'User-Agent': 'post-hub/1.0 (local experiment; openly licensed images)' };
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
// product key -> [commons file, 'pair' (front + back side by side) | 'single']
const PICS = {
  'iphone-15': ['File:IPhone 15.png', 'pair'],
  'iphone-15-plus': ['File:IPhone 15 plus.png', 'pair'],
  'iphone-15-pro': ['File:IPhone 15 pro.png', 'single'],
  'iphone-17-pro': ['File:IPhone 17 Pro.png', 'single'],
};
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'real-'));
const j = await (await fetch('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1920&titles=' + encodeURIComponent(Object.values(PICS).map(v => v[0]).join('|')), { headers: UA })).json();
const info = {}; for (const p of Object.values(j.query.pages)) info[p.title] = p.imageinfo[0];

// alpha (opacity) per column of a picture, 1920 values, to find the gap between a front and a back photo
function columns(file) {
  const buf = execFileSync(ffmpeg, ['-loglevel', 'error', '-i', file, '-vf', 'format=rgba,alphaextract,scale=1920:1:flags=area,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 24 });
  return [...buf];
}
const attribution = ['# Photo attribution (catalog/real-iphones)', '', 'Pictures fetched from Wikimedia Commons by `studio/fetch-real-photos.mjs`. Each stays under its own licence.', ''];
fs.mkdirSync(out, { recursive: true });
for (const [key, [title, kind]] of Object.entries(PICS)) {
  const i = info[title], m = i.extmetadata, src = path.join(tmp, key + '.png');
  fs.writeFileSync(src, Buffer.from(await (await fetch(i.thumburl || i.url, { headers: UA })).arrayBuffer()));
  let pieces = [src];
  if (kind === 'pair') {   // cut at the emptiest column band around the middle (back left, front right)
    const c = columns(src); let best = -1, bestV = 1e9;
    for (let x = 560; x < 1360; x++) { const v = c.slice(x - 12, x + 12).reduce((a, b) => a + b, 0); if (v < bestV) { bestV = v; best = x; } }
    const L = path.join(tmp, key + '-L.png'), Rr = path.join(tmp, key + '-R.png');
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-vf', `crop=${best}:ih:0:0`, L]); execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-vf', `crop=iw-${best}:ih:${best}:0`, Rr]);
    pieces = [Rr, L];   // in these photos the back is on the left and the front on the right: front first (angle 0)
  }
  fs.rmSync(path.join(out, key), { recursive: true, force: true });
  for (const f of pieces) execFileSync(process.execPath, [path.join(here, 'product-pic.mjs'), key, f], { env: { ...process.env, CO: 'real-iphones' }, stdio: 'ignore' });
  const files = fs.readdirSync(path.join(out, key)).filter(f => f.endsWith('.png')).sort();
  const d = {}; new Function('PRODUCTS', fs.readFileSync(path.join(demo, key, 'product.js'), 'utf8'))(d);
  const P = { ...d[key], angles: files, source: { title, page: i.descriptionurl, license: m.LicenseShortName?.value, author: (m.Artist?.value || '').replace(/<[^>]+>/g, '').trim() } };
  fs.writeFileSync(path.join(out, key, 'product.js'), `/* ${P.name}: REAL photo (${P.source.license}, ${P.source.author}), texts are demo values. See ATTRIBUTION.md. */\nPRODUCTS[${JSON.stringify(key)}] = ${JSON.stringify(P, null, 2)};\n`);
  attribution.push(`- ${P.name}: "${title.replace('File:', '')}" by ${P.source.author}, ${P.source.license}, ${P.source.page}`);
  console.log(key, files.join(' '));
}
fs.writeFileSync(path.join(out, 'ATTRIBUTION.md'), attribution.join('\n') + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
