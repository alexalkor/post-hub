// Add one product picture to catalog/<company>/<key>/ the way the website pictures were added:
// download (if a URL), make a white background transparent, trim to the product (+12 px), cap the long side at 1600 px,
// save as the next <key>-<n>.png and append it to "angles" in product.js (if the product exists).
//   CO=<company> node studio/product-pic.mjs <key> <file-or-url> [--white]     --white: also key out white inside the picture (opaque white box)
// Check the result on a still (render.mjs ... --still): clear or white products can lose detail.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [key, src] = process.argv.slice(2), white = process.argv.includes('--white');
if (!key || !src) { console.error('usage: CO=<company> node studio/product-pic.mjs <key> <file-or-url> [--white]'); process.exit(1); }
const ffmpeg = process.env.FFMPEG || 'ffmpeg', tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pic-'));
const ff = (...a) => { const r = spawnSync(ffmpeg, ['-hide_banner', '-y', ...a]); if (r.status) throw new Error(r.stderr.toString().slice(-300)); return r.stderr.toString(); };
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'catalog', process.env.CO || 'demo-iphones', key);

let file = src;
if (/^https?:/.test(src)) { const r = await fetch(src); if (!r.ok) throw new Error(`download failed: ${r.status}`); file = path.join(tmp, 'in' + path.extname(new URL(src).pathname)); fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); }

// alpha bounding box; threshold first so thin wires count (cropdetect looks at whole lines)
const bbox = f => { const m = [...ff('-i', f, '-vf', "format=rgba,alphaextract,lut=c0='if(gt(val,16),255,0)',cropdetect=limit=0:round=2:reset=0:skip=0", '-frames:v', '1', '-f', 'null', '-').matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)].pop(); return m && m.slice(1).map(Number); };
const keyed = path.join(tmp, 'keyed.png');
ff('-i', file, '-vf', 'format=rgba', '-frames:v', '1', keyed);
let b = bbox(keyed);
const dims = ff('-i', keyed, '-f', 'null', '-').match(/, (\d+)x(\d+)/).slice(1).map(Number);
if (white || (b[0] === dims[0] && b[1] === dims[1])) { ff('-i', file, '-vf', 'format=rgba,colorkey=white:0.06:0.05', '-frames:v', '1', keyed); b = bbox(keyed); }
const p = 12, x = Math.max(0, b[2] - p), y = Math.max(0, b[3] - p), w = Math.min(dims[0] - x, b[0] + 2 * p), h = Math.min(dims[1] - y, b[1] + 2 * p);

fs.mkdirSync(dir, { recursive: true });
const nums = fs.readdirSync(dir).map(f => f.match(new RegExp(`^${key}-(\\d+)\\.png$`))).filter(Boolean).map(m => +m[1]);
const name = `${key}-${nums.length ? Math.max(...nums) + 1 : 0}.png`;
ff('-i', keyed, '-vf', `crop=${w}:${h}:${x}:${y},scale='if(gt(iw,ih),min(1600,iw),-2)':'if(gt(iw,ih),-2,min(1600,ih))':flags=lanczos,format=rgba`, '-frames:v', '1', path.join(dir, name));
const pjs = path.join(dir, 'product.js');
if (fs.existsSync(pjs)) fs.writeFileSync(pjs, fs.readFileSync(pjs, 'utf8').replace(/("angles": \[[\s\S]*?)(\n  \])/, (_, a, z) => `${a},\n    "${name}"${z}`));
console.log(`saved catalog/${key}/${name} (${w}x${h})${fs.existsSync(pjs) ? ', added to product.js' : ', no product.js yet: add one (see catalog/demo-iphones/iphone-16/product.js)'}`);
fs.rmSync(tmp, { recursive: true, force: true });
