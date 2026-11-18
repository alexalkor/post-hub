// Renders every example the showcase page shows, into showcase/assets/ (small web files).
//   node showcase/build-assets.mjs            all (about 10 minutes: videos take a minute each)
//   node showcase/build-assets.mjs looks      only a group: looks | video | carousel | cutout
// Needs Node 22+, Chrome, ffmpeg. The "cutout" group also needs the AI cut-out (docs/cutout.md) and runs studio/fetch-messy-test.mjs first (two openly licensed CC0 photos are used).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..'), A = path.join(here, 'assets');
const only = process.argv[2], want = g => !only || only === g;
const ffmpeg = process.env.FFMPEG || 'ffmpeg', node = process.execPath, tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'showcase-'));
const run = (script, ...args) => execFileSync(node, [path.join(root, 'studio', script), ...args], { stdio: 'ignore', cwd: root });
const jpg = (src, dst, w, q = 4) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-vf', `scale=${w}:-2:flags=lanczos`, '-q:v', String(q), dst]); };
const BRANDS = ['volt', 'linen', 'pop'], TPLS = ['aurora', 'stage', 'bento', 'swiss', 'editorial', 'soft', 'split', 'kinetic', 'brutal', 'blueprint'];

if (want('looks')) for (const b of BRANDS) for (const t of TPLS) {
  run('render.mjs', 'iphone-16-pro', 'en', b, t, `${b}-${t}`, '--still', `--out=${tmp}`, 'badge=new');
  jpg(path.join(tmp, `${b}-${t}.png`), path.join(A, 'looks', `${b}-${t}.jpg`), 640); console.log('look', b, t);
}
if (want('video')) for (const [name, p, b, t, motion, fmt] of [['aurora-volt', 'iphone-17-pro', 'volt', 'aurora', 'float', '4:5'], ['brutal-pop', 'iphone-16', 'pop', 'brutal', 'sway', '4:5'],
  ['reel-linen', 'iphone-air', 'linen', 'editorial', 'sway', '9:16'], ['stage-volt', 'iphone-16-pro-max', 'volt', 'stage', 'hover3d', '9:16']]) {
  run('render.mjs', p, 'en', b, t, name, `--out=${tmp}`, `motion=${motion}`, `fmt=${fmt}`, 'badge=new');
  fs.mkdirSync(path.join(A, 'video'), { recursive: true });
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', path.join(tmp, `${name}.mp4`), '-vf', 'scale=540:-2:flags=lanczos', '-c:v', 'libx264', '-crf', '29', '-preset', 'slow', '-an', '-movflags', '+faststart', path.join(A, 'video', `${name}.mp4`)]);
  jpg(path.join(tmp, `${name}.png`), path.join(A, 'video', `${name}.jpg`), 540); console.log('video', name);
}
if (want('carousel')) for (const [car, b] of [['panorama', 'linen'], ['deck', 'volt'], ['numbered', 'pop']]) {
  run('carousel.mjs', 'iphone-17-pro', 'en', b, car, `sc-${car}`);
  const dir = path.join(root, 'output', 'carousels', `sc-${car}`);
  fs.readdirSync(dir).filter(f => /^slide-\d+\.png$/.test(f)).forEach(f => jpg(path.join(dir, f), path.join(A, 'carousel', `${car}-${f.match(/\d+/)[0]}.jpg`), 540)); console.log('carousel', car);
}
if (want('cutout')) {
  const UA = { 'User-Agent': 'post-hub/1.0 (showcase; openly licensed images)' };
  run('fetch-messy-test.mjs');
  const titles = { wood: 'File:IPhone 17 Pro (2025-12-28).jpg', shelf: 'File:Silver iPhone 17 Pro Max.jpg' };
  const j = await (await fetch('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&titles=' + encodeURIComponent(Object.values(titles).join('|')), { headers: UA })).json();
  const byTitle = Object.fromEntries(Object.values(j.query.pages).map(p => [p.title, p.imageinfo[0]])), credits = [];
  for (const [k, t] of Object.entries(titles)) { const i = byTitle[t], f = path.join(tmp, k + '.jpg'); fs.writeFileSync(f, Buffer.from(await (await fetch(i.thumburl, { headers: UA })).arrayBuffer())); jpg(f, path.join(A, 'cutout', `${k}-photo.jpg`), 540);
    credits.push(`${k}: ${t.replace('File:', '')}, ${i.extmetadata.LicenseShortName.value}, ${i.descriptionurl}`); }
  fs.writeFileSync(path.join(A, 'cutout', 'CREDITS.txt'), credits.join('\n') + '\n');
  for (const [key, b, t, k] of [['phone-on-wood', 'volt', 'aurora', 'wood'], ['phone-on-shelf', 'linen', 'soft', 'shelf']]) {
    run('render.mjs', key, 'en', b, t, `cut-${k}`, '--still', `--out=${tmp}`, 'co=real-messy', 'title=Your product', 'sub=From a phone photo', 'c1=Cut out in seconds', 'c2=On your brand', 'c3=Ready to post');
    jpg(path.join(tmp, `cut-${k}.png`), path.join(A, 'cutout', `${k}-post.jpg`), 540);
    const cut = path.join(root, 'catalog', 'real-messy', key, `${key}-0.png`);   // trimmed RGBA cut-out
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', cut, '-vf', 'format=rgba,scale=-2:540:flags=lanczos,format=rgba', path.join(A, 'cutout', `${k}-cutout.png`)]); console.log('cutout', k);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log('done:', A);
