// AI background removal (local model, no cloud, no account): better than studio/cutout.mjs on busy backgrounds, crowds, hair, glass.
//   node studio/cutout-ai.mjs <photo> <out.png> [--model=small|medium] [--crop=x0,y0,x1,y1] [--clean] [--preview]
//   --crop   keep only this part of the photo first (fractions), e.g. --crop=0,0,1,0.88 drops a shop stand below the product
//   --clean  remove faint leftovers (soft shadows, halos): alpha below about 25 % goes to 0, the rest is stretched
// One-time install (about 330 MB incl. the model, outside the repo): see the error text below or docs/cutout.md
// Then add the result to a product like any cut-out: node studio/product-pic.mjs <key> <out.png>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), pos = args.filter(a => !a.startsWith('--')), flag = k => (args.find(a => a.startsWith('--' + k + '=')) || '').slice(k.length + 3);
const [src, out] = pos; if (!src || !out) { console.error('usage: node studio/cutout-ai.mjs <photo> <out.png> [--model=small|medium] [--preview]'); process.exit(1); }
// installed outside the repo (and outside any cloud-synced folder): ~/.post-hub/cutout (or POST_HUB_CUTOUT)
const home = process.env.POST_HUB_CUTOUT || path.join(os.homedir(), '.post-hub', 'cutout');
const pkg = path.join(home, 'node_modules', '@imgly', 'background-removal-node', 'dist', 'index.mjs');
if (!fs.existsSync(pkg)) { console.error('AI cut-out is not installed. One time: mkdir -p ~/.post-hub/cutout && cp tools/cutout/package.json ~/.post-hub/cutout/ && cd ~/.post-hub/cutout && npm install   (about 330 MB, not in Git). On Windows without the Visual C++ runtime, also see docs/cutout.md'); process.exit(2); }
const { removeBackground } = await import(pathToFileURL(pkg).href);
const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[path.extname(src).toLowerCase()] || 'image/jpeg';
const t0 = Date.now(), tmpIn = out + '.in.png';
let input = fs.readFileSync(src), inMime = mime;
if (flag('crop')) {   // crop first with ffmpeg
  const [x0, y0, x1, y1] = flag('crop').split(',').map(Number);
  execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vf', `crop=iw*${x1 - x0}:ih*${y1 - y0}:iw*${x0}:ih*${y0}`, tmpIn]); input = fs.readFileSync(tmpIn); inMime = 'image/png'; fs.rmSync(tmpIn);
}
const blob = await removeBackground(new Blob([input], { type: inMime }), { publicPath: pathToFileURL(path.dirname(pkg) + path.sep).href, model: flag('model') || 'medium', output: { format: 'image/png' } });
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, Buffer.from(await blob.arrayBuffer()));
if (args.includes('--clean')) { const t = out + '.clean.png'; execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-i', out, '-vf', "format=rgba,lut=a='clip((val-64)*1.35,0,255)'", t]); fs.renameSync(t, out); }
console.log(`OK (AI): ${path.basename(src)} -> ${out}  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (args.includes('--preview')) {
  const H = 520, prev = out.replace(/\.png$/, '') + '-preview.png';
  execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-i', out, '-f', 'lavfi', '-i', `color=c=magenta:s=2000x${H}`, '-f', 'lavfi', '-i', `color=c=0x1c1f26:s=2000x${H}`, '-filter_complex',
    `[0]scale=-2:${H}[o];[1]scale=-2:${H},split[c1][c2];[2][c1]scale2ref[mb][r1];[mb][r1]overlay[m];[3][c2]scale2ref[db][r2];[db][r2]overlay[d];[o][m][d]hstack=3`, '-frames:v', '1', prev]);
}
