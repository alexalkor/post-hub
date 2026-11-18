// One command makes the still and the video of a post (the post hub: catalog x brand kit x template):
//   node studio/render.mjs <product> <lang> <brand> <template> [name] [key=value ...]
//   product: a key in catalog/<co>/ (or random); lang: en | pl | ru; brand: a folder in brands/ (or auto / random); template: a folder in templates/ (auto = the brand's default, or random)
//   e.g. node studio/render.mjs iphone-16-pro en volt aurora my-post motion=float tm=rise
//   settings: co=<catalog> motion=float|sway|hover3d|pulse|drift|none tm=rise|fade|pop|none fmt=4:5|3:4|1:1|9:16 a=<picture> title= sub= c1..c3= n=0-4 cta= badge=new|hit|<text> ghost= (all also in studio/hub.html)
//   --still   the PNG only (fast preview, no ffmpeg needed)       --gif   also write a looping GIF
//   --final   same size, high bitrate, no size cap: <name>-final.mp4       --master   2x master (2160 wide): <name>-master.mp4 (both make the video only)
//   --out=<folder>   save there; otherwise ../output/videos and ../output/stills (not in Git)
// Needs: Node 22+ (built-in WebSocket), Google Chrome and ffmpeg (Windows: winget install Gyan.FFmpeg, Mac: brew install ffmpeg). No npm packages.
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const stillOnly = process.argv.includes('--still');          // --still = PNG only, no video (fast preview)
const gif = process.argv.includes('--gif');                  // --gif = also write a looping GIF
const local = true;
const master = process.argv.includes('--master');           // --master = 2x master (2160 wide, drawn at 2x), for website / ads / archive, not for social feeds
const finalRun = master || process.argv.includes('--final'); // --final = final: same size as the draft, high bitrate, no size cap, <name>-final.mp4, no still
if (finalRun && stillOnly) throw new Error('--final / --master make a video: do not combine with --still');
const outArg = (process.argv.find(x => x.startsWith('--out=')) || '').slice(6);
const argv = process.argv.slice(2).filter(x => x !== '--still' && x !== '--gif' && x !== '--local' && x !== '--final' && x !== '--master' && !x.startsWith('--out='));
const extras = argv.filter(x => x.includes('='));           // any extra setting, e.g. a=4 pattern=rings "title=My title"
let [p = 'iphone-16-pro', lang = 'en', bg = 'auto', layout = 'auto', nameArg] = argv.filter(x => !x.includes('='));
const FPS = 30, SECS = 7;
const fmt = (extras.find(e => e.startsWith('fmt=')) || 'fmt=4:5').slice(4);   // 4:5 | 3:4 | 1:1 | 9:16
const [W, H] = { '4:5': [1080, 1350], '3:4': [1080, 1440], '1:1': [1080, 1080], '9:16': [1080, 1920] }[fmt] || [1080, 1350];
const here = path.dirname(fileURLToPath(import.meta.url));
// --- random and account defaults ---
// bg=auto: the account's first background; bg=random: any background of the account (library/accounts/<acc>.js).
// random also works for motion, layout and for stage= pattern= card= pills= tm= type= (any file in that library folder) and fx= (one or two effects).
// The picked values replace 'random' everywhere, so the file name and meta show what was used.
// --- hub inputs: catalog (co=), brand kit (brands/<id>/brand.js), template (templates/<id>/template.css) ---
const root = path.join(here, '..');
const any = a => a[Math.floor(Math.random() * a.length)];
const dirs = d => fs.readdirSync(path.join(root, d), { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('_')).map(e => e.name);
let co = (extras.find(e => e.startsWith('co=')) || '').slice(3);
if (!co) { co = dirs('catalog')[0]; extras.push('co=' + co); }
if (p === 'random') p = any(dirs('catalog/' + co));
const brands = dirs('brands'), tpls = dirs('templates');
if (bg === 'auto') bg = brands[0];
if (bg === 'random') bg = any(brands);
if (!brands.includes(bg)) throw new Error(`Unknown brand "${bg}". Brands: ${brands.join(', ')} (new one: copy brands/_blank)`);
if (layout === 'random') layout = any(tpls);
if (layout === 'auto') { const B = {}; new Function('BRANDS', fs.readFileSync(path.join(root, 'brands', bg, 'brand.js'), 'utf8'))(B); layout = B[bg]?.defaults?.tpl || tpls[0]; }
if (!tpls.includes(layout)) throw new Error(`Unknown template "${layout}". Templates: ${tpls.join(', ')}`);
const GROUPSET = { motion: ['float', 'sway', 'hover3d', 'pulse', 'drift', 'none'], tm: ['rise', 'fade', 'pop', 'none'] };
extras.forEach((e, i) => { const [k, v] = [e.slice(0, e.indexOf('=')), e.slice(e.indexOf('=') + 1)]; if (v === 'random' && GROUPSET[k]) extras[i] = k + '=' + any(GROUPSET[k]); });
if (process.argv.some(a => a === 'random' || a.endsWith('=random'))) console.log('random picks:', p, bg, layout, extras.join(' '));
const motion = ((extras.find(e => e.startsWith('motion=')) || '').slice(7)) || 'default';
// default name follows the team rule YYYY-MM-DD-<initials>-<product>-<lang>-<bg>-<motion>-<layout>
// initials: the POSTHUB_INITIALS environment variable wins, else the first letters of git config user.name
const initials = (process.env.POSTHUB_INITIALS || '').trim().toLowerCase() || (() => { try { return execFileSync('git', ['config', 'user.name'], { cwd: here, encoding: 'utf8' }).trim().split(/\s+/).map(w => w[0] || '').join('').toLowerCase(); } catch { return ''; } })() || 'xx';
const today = new Date().toLocaleDateString('sv-SE');   // YYYY-MM-DD, local date
const name = nameArg || `${today}-${initials}-${p}-${lang}-${bg}-${layout}${motion === 'default' ? '' : '-' + motion}`;
const item = outArg ? path.resolve(outArg) : '';
const outDir = kind => item || path.join(here, '..', 'output', kind);   // kind: videos | stills
for (const d of ['videos', 'stills']) fs.mkdirSync(outDir(d), { recursive: true });

// Chrome: set CHROME to override. Otherwise looks in the usual places on Windows, macOS and Linux.
const home = os.homedir(), lad = process.env.LOCALAPPDATA || '';
const chrome = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(lad, 'Google/Chrome/Application/chrome.exe'), 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', path.join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'].find(fs.existsSync);
if (!chrome) throw new Error('Chrome not found. Install Google Chrome, or set the CHROME environment variable to its full path.');

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return 'ffmpeg'; } catch {}
  for (const f of ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg']) if (fs.existsSync(f)) return f;   // macOS Homebrew / Linux
  const base = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
  const walk = (dir, depth = 0) => {
    if (depth > 4 || !fs.existsSync(dir)) return null;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isFile() && e.name === 'ffmpeg.exe') return f;
      if (e.isDirectory()) { const r = walk(f, depth + 1); if (r) return r; }
    }
    return null;
  };
  for (const e of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    if (e.startsWith('Gyan.FFmpeg')) { const r = walk(path.join(base, e)); if (r) return r; }
  }
  throw new Error('ffmpeg not found. Install it: Windows: winget install Gyan.FFmpeg | Mac: brew install ffmpeg');
}
const ffmpeg = stillOnly ? null : findFfmpeg();

// --- start Chrome with a debugging port and connect ---
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'posthub-'));
const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, `--window-size=${W},${H}`, ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []), 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
process.on('exit', () => proc.kill());   // a failed render must not leave a hidden Chrome running
const port = await new Promise((res, rej) => {
  let buf = '';
  proc.stderr.on('data', d => { buf += d; const m = buf.match(/ws:\/\/127\.0\.0\.1:(\d+)\//); if (m) res(m[1]); });
  proc.on('exit', () => rej(new Error('Chrome exited early')));
  setTimeout(() => rej(new Error('Chrome start timeout')), 20000);
});
const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); const h = pend.get(m.id); if (h) { pend.delete(m.id); m.error ? h.rej(new Error(m.error.message)) : h.res(m.result); } };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = (expression) => send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });

await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: master ? 2 : 1, mobile: false });
const url = extra => pathToFileURL(path.join(here, 'hub.html')).href + `?p=${p}&lang=${lang}&brand=${bg}&tpl=${layout}${extras.map(e => '&' + encodeURIComponent(e.split('=')[0]) + '=' + encodeURIComponent(e.slice(e.indexOf('=') + 1))).join('')}${extra}`;
async function open(extra) {
  await send('Page.navigate', { url: url(extra) });
  for (let i = 0; i < 100; i++) { if ((await evalJs('document.readyState')).result.value === 'complete') break; await new Promise(r => setTimeout(r, 100)); }
  await evalJs('window.ready');
}
const shot = async () => Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64');

const out = path.join(outDir('videos'), `${name}${master ? '-master' : finalRun ? '-final' : ''}.mp4`);
// Files are finished in the temp folder first, then moved into place in one step,
// so a synced folder never picks up a half-written video.
const tmpOut = path.join(profile, `${name}.mp4`);
const place = (from, to) => { fs.copyFileSync(from, to + '.part'); fs.renameSync(to + '.part', to); fs.rmSync(from, { force: true }); };
// --- video: step the page clock frame by frame, pipe PNGs into ffmpeg ---
if (!stillOnly) {
// draft: crf 17, then capped to POSTHUB_MAX_MB. final: normal-size frames, crf 15, max 12 Mbps (the gain over the draft is the bitrate; a 2x drawing scaled down looked the same and took 4 times longer) (Instagram takes 5 to 8, API limit 25).
// master: the 2x frames as they are, crf 16, max 40 Mbps.
const vf = 'noise=alls=3:allf=t,format=yuv420p';
const enc = master ? ['-crf', '16', '-maxrate', '40M', '-bufsize', '80M'] : finalRun ? ['-crf', '15', '-maxrate', '12M', '-bufsize', '24M'] : ['-crf', '17'];
const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', ...enc, '-profile:v', 'high',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', tmpOut], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg failed ' + c)))));
await open('');
const n = FPS * SECS;
for (let i = 0; i < n; i++) {
  await evalJs(`seek(${(i * 1000) / FPS});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
  const png = await shot();
  if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
}
ff.stdin.end(); await done;
// Size cap: a video over POSTHUB_MAX_MB (default 4.8, a common upload limit) is encoded again in two passes
// to the best quality that fits. Smaller videos are left exactly as they were. Set POSTHUB_MAX_MB=100 to keep the full quality.
const maxMb = Number(process.env.POSTHUB_MAX_MB || 4.8);
if (!finalRun && fs.statSync(tmpOut).size > maxMb * 1e6) {
  const fit = tmpOut.replace(/\.mp4$/, '-fit.mp4'), kbps = Math.floor(maxMb * 8000 / SECS * 0.97);
  const pass = (n, to) => execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', tmpOut, '-c:v', 'libx264', '-preset', 'slow', '-b:v', kbps + 'k',
    '-pass', String(n), '-passlogfile', path.join(profile, 'pass'), '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', ...to]);
  pass(1, ['-f', 'null', '-']); pass(2, [fit]);
  fs.renameSync(fit, tmpOut);
  if (fs.statSync(tmpOut).size > maxMb * 1.05e6) console.log(`warning: video is still ${(fs.statSync(tmpOut).size / 1e6).toFixed(1)} MB, over ${maxMb} MB`);
}
if (gif) { const tg = tmpOut.replace(/.mp4$/, '.gif'); execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', tmpOut, '-vf', 'fps=15,scale=540:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', '-loop', '0', tg]); place(tg, out.replace(/.mp4$/, '.gif')); }
place(tmpOut, out);
}

// --- still: the finished frame ---
const stillPath = path.join(outDir('stills'), `${name}.png`);
if (!finalRun) {
  await open('&still=1');
  const tmpStill = path.join(profile, `${name}.png`);
  fs.writeFileSync(tmpStill, await shot()); place(tmpStill, stillPath);
}

ws.close(); proc.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
console.log(stillOnly ? `done: ${stillPath}` : finalRun ? `done: ${out}  (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)` : `done: ${out}  ${stillPath}  (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
process.exit(0);
