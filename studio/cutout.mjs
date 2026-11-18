// Background removal for product photos, no install (runs in Chrome, studio/cutout.html): learns the background from the photo edges.
//   node studio/cutout.mjs <photo> <out.png> [--box=x0,y0,x1,y1] [--roi=x0,y0,x1,y1] [--k=6] [--bias=1] [--keep-edge] [--hole=0.006] [--preview]
//   --box   where the product surely is (fractions of the picture, default the middle 40 %)  --roi  only look inside this area (cuts away a stand, a hand, a crowd)
//   --bias  above 1 favours background (product too big), below 1 favours product (parts missing)   --keep-edge  product touches the picture edge
//   --close  gap-closing radius in working pixels (default 16; 0 = off; raise to fill big reflections, lower to keep thin gaps like a headphone arc)
//   --bg    name the backdrop when the product touches the photo edge: white | light | dark | black | #rrggbb
//   --all   keep every blob (several items: a case and two earbuds), not only the biggest
//   --hull  fill the product with its convex outline: solid shapes (phones, boxes, bottles) with big reflections or a screen that looks like the background
//   --thr   how unlike the background a pixel must be to count as product at the start (default 2.2; lower = more product)
//   --hole  largest see-through hole to fill, as a fraction of the picture (default 0.006; raise 0.05 for a ring)
//   --preview  also writes <out>-preview.png: original | cutout on magenta | cutout on dark, to judge it by eye
// Prints a verdict (OK / CHECK / FAIL) with the numbers: product share of the picture, how much of the edge is product, blobs found.
// Then add the cut-out to a product with: node studio/product-pic.mjs <key> <out.png>   (it only trims and resizes a picture that already has transparency)
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), pos = args.filter(a => !a.startsWith('--')), flag = k => (args.find(a => a.startsWith('--' + k + '=')) || '').slice(k.length + 3);
const [src, out] = pos; if (!src || !out) { console.error('usage: node studio/cutout.mjs <photo> <out.png> [--box=..] [--roi=..] [--k=6] [--bias=1] [--keep-edge] [--preview]'); process.exit(1); }
const arr = s => s ? s.split(',').map(Number) : undefined;
const opts = { box: arr(flag('box')), roi: arr(flag('roi')), k: +flag('k') || undefined, bias: +flag('bias') || undefined, hole: flag('hole') ? +flag('hole') : undefined, close: flag('close') !== '' ? +flag('close') : undefined, keepEdge: args.includes('--keep-edge'), hull: args.includes('--hull'), all: args.includes('--all'), bg: flag('bg') || undefined, thr: +flag('thr') || undefined };
const lad = process.env.LOCALAPPDATA || '', home = os.homedir();
const chrome = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', path.join(lad, 'Google/Chrome/Application/chrome.exe'),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', path.join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(fs.existsSync);
if (!chrome) throw new Error('Chrome not found. Set CHROME.');
const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[path.extname(src).toLowerCase()] || 'image/jpeg';
const dataUrl = `data:${mime};base64,` + fs.readFileSync(src).toString('base64');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cut-'));
const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
process.on('exit', () => proc.kill());
const port = await new Promise((res, rej) => { let b = ''; proc.stderr.on('data', d => { b += d; const m = b.match(/ws:\/\/127\.0\.0\.1:(\d+)\//); if (m) res(m[1]); }); setTimeout(() => rej(new Error('Chrome start timeout')), 20000); });
const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); const h = pend.get(m.id); if (h) { pend.delete(m.id); m.error ? h.rej(new Error(m.error.message)) : h.res(m.result); } };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.navigate', { url: pathToFileURL(path.join(here, 'cutout.html')).href });
for (let i = 0; i < 100; i++) { if ((await send('Runtime.evaluate', { expression: 'window.ready===true', returnByValue: true })).result.value) break; await new Promise(r => setTimeout(r, 100)); }
const r = await send('Runtime.evaluate', { expression: `window.cutout(${JSON.stringify(dataUrl)}, ${JSON.stringify(opts)})`, awaitPromise: true, returnByValue: true });
if (r.exceptionDetails) throw new Error('cutout failed: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
const v = r.result.value; fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, Buffer.from(v.png.split(',')[1], 'base64'));
ws.close(); proc.kill(); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
const pct = x => Math.round(x * 100) + '%';
const notes = []; let verdict = 'OK';
if (v.fgFrac < .04) { verdict = 'FAIL'; notes.push('almost nothing kept: product too like the background? try --box around the product or --bias=0.7'); }
else if (v.fgFrac > .85) { verdict = 'FAIL'; notes.push('almost everything kept: background too like the product? try --bias=1.5 or --roi'); }
if (v.borderFg > .25) { verdict = verdict === 'FAIL' ? verdict : 'CHECK'; notes.push('product touches the picture edge (' + pct(v.borderFg) + ' of the border): cropped photo, or background left on the edge'); }
if (v.solidity < .93 && !args.includes('--hull') && v.solidity > .7) notes.push('outline has dents (solidity ' + v.solidity.toFixed(2) + '): for a solid object try --hull; for ring/arc shapes keep as is');
if (v.comps > 1) { verdict = verdict === 'FAIL' ? verdict : 'CHECK'; notes.push(v.comps + ' blobs found, only the biggest kept (parts may be lost: other earbud, strap, accessories)'); }
console.log(`${verdict}: ${path.basename(src)} -> ${out}  product ${pct(v.fgFrac)} of picture, edge ${pct(v.borderFg)}, blobs ${v.comps}${notes.length ? '\n  ' + notes.join('\n  ') : ''}`);
if (args.includes('--preview')) {
  const prev = out.replace(/\.png$/, '') + '-preview.png', H = 520;
  execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-i', out, '-f', 'lavfi', '-i', `color=c=magenta:s=2000x${H}`, '-f', 'lavfi', '-i', `color=c=0x1c1f26:s=2000x${H}`, '-filter_complex',
    `[0]scale=-2:${H}[o];[1]scale=-2:${H},split[c1][c2];[2][c1]scale2ref[mb][r1];[mb][r1]overlay[m];[3][c2]scale2ref[db][r2];[db][r2]overlay[d];[o][m][d]hstack=3`, '-frames:v', '1', prev]);
}
