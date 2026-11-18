// Renders a swipe carousel: one PNG per slide (1080 x 1350) plus a contact sheet.
//   node studio/carousel.mjs <product> <lang> <brand> <carousel> [name] [plan=cover,fact:0,fact:1,fact:2,angles:2,cta] [co=<catalog>] [title= sub= cta= url=]
//   carousel: a folder in carousels/ (panorama | deck | numbered)    slide types in the plan: cover | fact:<row 0-3> | specs | angles:<picture> | cta
//   -> output/carousels/<name>/slide-1.png ... slide-N.png and sheet.png (all slides side by side)
// Needs Node 22+, Google Chrome and ffmpeg (only for the sheet).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..');
const argv = process.argv.slice(2), extras = argv.filter(a => a.includes('=')), pos = argv.filter(a => !a.includes('='));
const [p = 'iphone-16-pro', lang = 'en', brand = 'volt', car = 'panorama', nameArg] = pos;
const dirs = d => fs.readdirSync(path.join(root, d), { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('_')).map(e => e.name);
if (!dirs('carousels').includes(car)) throw new Error(`Unknown carousel "${car}". Carousels: ${dirs('carousels').join(', ')}`);
if (!dirs('brands').includes(brand)) throw new Error(`Unknown brand "${brand}". Brands: ${dirs('brands').join(', ')}`);
const get = k => (extras.find(e => e.startsWith(k + '=')) || '').slice(k.length + 1);
const co = get('co') || dirs('catalog')[0], plan = (get('plan') || 'cover,fact:0,fact:1,fact:2,angles:2,cta').split(',');
const name = nameArg || `${p}-${lang}-${brand}-${car}`, out = path.join(root, 'output', 'carousels', name);
fs.mkdirSync(out, { recursive: true });
const lad = process.env.LOCALAPPDATA || '', home = os.homedir();
const chrome = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', path.join(lad, 'Google/Chrome/Application/chrome.exe'),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', path.join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(fs.existsSync);
if (!chrome) throw new Error('Chrome not found. Set CHROME.');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'car-'));
const base = pathToFileURL(path.join(here, 'carousel.html')).href;
for (let s = 0; s < plan.length; s++) {
  const q = [`p=${p}`, `lang=${lang}`, `brand=${brand}`, `car=${car}`, `co=${co}`, `s=${s}`, `plan=${encodeURIComponent(plan.join(','))}`, ...extras.filter(e => !/^(co|plan)=/.test(e)).map(e => encodeURIComponent(e.split('=')[0]) + '=' + encodeURIComponent(e.slice(e.indexOf('=') + 1)))].join('&');
  const file = path.join(out, `slide-${s + 1}.png`);
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, '--virtual-time-budget=4000', '--window-size=1080,1350', `--screenshot=${file}`, `${base}?${q}`], { stdio: 'ignore' });
  if (!fs.existsSync(file)) throw new Error('slide ' + (s + 1) + ' was not rendered');
}
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
try {
  const ins = plan.flatMap((_, i) => ['-i', path.join(out, `slide-${i + 1}.png`)]);
  const f = plan.map((_, i) => `[${i}]scale=360:-1[s${i}]`).join(';') + ';' + plan.map((_, i) => `[s${i}]`).join('') + `hstack=${plan.length}`;
  execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', f, path.join(out, 'sheet.png')]);
} catch { console.log('note: sheet.png needs ffmpeg'); }
console.log(`done: ${out}  (${plan.length} slides)`);
