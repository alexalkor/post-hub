// Readiness check for a new company: is the brand kit complete and legible, is the catalog complete and are the pictures usable?
//   node studio/onboard-check.mjs <brand-id> [--catalog=<company>] [--sheet=<product>]
//   brand-id: a folder in brands/    --catalog: a folder in catalog/ (default: the same name as the brand, else the first catalog)
//   --sheet=<product>: also renders that product on every template (studio/gallery.mjs) into output/gallery/ for the look-selection session
// Prints PASS / WARN / FAIL per check. Exit code 1 when anything FAILs. Run it before showing a client anything.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), pos = args.filter(a => !a.startsWith('--')), flag = k => (args.find(a => a.startsWith('--' + k + '=')) || '').slice(k.length + 3);
const id = pos[0];
const dirs = d => fs.existsSync(path.join(root, d)) ? fs.readdirSync(path.join(root, d), { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('_')).map(e => e.name) : [];
if (!id || !dirs('brands').includes(id)) { console.error(`usage: node studio/onboard-check.mjs <brand-id> [--catalog=<company>] [--sheet=<product>]\nbrands: ${dirs('brands').join(', ') || '(none)'}   (new one: copy brands/_blank)`); process.exit(2); }
const catalogId = flag('catalog') || (dirs('catalog').includes(id) ? id : dirs('catalog')[0]);
const rows = []; const add = (level, area, msg) => rows.push([level, area, msg]);

// ---------- brand kit ----------
const B = {}; try { new Function('BRANDS', fs.readFileSync(path.join(root, 'brands', id, 'brand.js'), 'utf8'))(B); } catch (e) { add('FAIL', 'brand', 'brand.js does not load: ' + e.message); }
const kit = B[id] || B[Object.keys(B)[0]];
const hex = c => /^#[0-9a-f]{6}$/i.test(c || '') ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : null;
const lum = ([r, g, b]) => { const f = v => (v /= 255) <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
if (kit) {
  if (!B[id]) add('FAIL', 'brand', `the key inside brand.js is "${Object.keys(B)[0]}", it must match the folder name "${id}"`);
  for (const k of ['name', 'tagline', 'url']) if (!kit[k] || /^(Company name|Tagline|example\.com)$/.test(kit[k])) add('WARN', 'brand', `${k} is empty or still the blank-kit placeholder`);
  const c = kit.colors || {}; const need = ['bg', 'bg2', 'ink', 'muted', 'accent', 'accent2', 'surface', 'onAccent'];
  const missing = need.filter(k => !hex(c[k])); if (missing.length) add('FAIL', 'brand', 'colours missing or not #rrggbb: ' + missing.join(', '));
  else {
    const t = (a, b, min, what) => { const r = ratio(hex(c[a]), hex(c[b])); add(r >= min ? 'PASS' : r >= min * .8 ? 'WARN' : 'FAIL', 'contrast', `${what}: ${r.toFixed(1)}:1 (needs ${min}:1)`); };
    t('ink', 'bg', 4.5, 'text on the page background'); t('ink', 'surface', 4.5, 'text on cards and tiles'); t('muted', 'bg', 3, 'secondary text on the page'); t('onAccent', 'accent', 3, 'text on the accent colour');
    const same = ratio(hex(c.accent), hex(c.accent2)); if (same < 1.15) add('WARN', 'brand', 'accent and accent2 are almost the same colour; templates use both');
  }
  const fonts = new Set(fs.readdirSync(path.join(root, 'studio', 'fonts')).filter(f => f.endsWith('.css')).flatMap(f => [...fs.readFileSync(path.join(root, 'studio', 'fonts', f), 'utf8').matchAll(/font-family: '([^']+)'/g)].map(m => m[1])));
  for (const role of ['display', 'body', 'mono']) { const f = (kit.fonts || {})[role]; if (!f) add('FAIL', 'fonts', `fonts.${role} missing`); else if (!fonts.has(f)) add('WARN', 'fonts', `"${f}" is not in studio/fonts (add it to studio/fonts.mjs and run it); renders fall back to Inter`); }
  if (!kit.logo || (!kit.logo.text && !kit.logo.mark)) add('FAIL', 'logo', 'logo.text or logo.mark is needed'); else if (kit.logo.mark && !/currentColor/.test(kit.logo.mark)) add('WARN', 'logo', 'logo.mark should use currentColor so templates can colour it');
  const cta = kit.cta || {}; for (const l of ['en', 'pl', 'ru']) if (!cta[l]) add('WARN', 'brand', `cta.${l} missing (falls back to English)`);
  if (!kit.defaults || !dirs('templates').includes(kit.defaults.tpl)) add('WARN', 'brand', 'defaults.tpl is not a template folder');
  if (!rows.some(r => r[0] === 'FAIL' && r[1] !== 'contrast')) add('PASS', 'brand', `kit "${kit.name}" loads, colours and fonts are set`);
}

// ---------- catalog ----------
const prods = dirs('catalog/' + (catalogId || '_none'));
if (!catalogId || !prods.length) add('FAIL', 'catalog', `no products in catalog/${catalogId || '<company>'}/`);
else {
  const probe = f => { try { const [w, h, pf] = execFileSync(process.env.FFPROBE || 'ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,pix_fmt', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim().split(','); return { w: +w, h: +h, pf }; } catch { return null; } };
  let ok = 0; const alphaFmt = /^(rgba|bgra|argb|abgr|ya8|ya16|gbrap|rgba64|pal8)/;
  for (const p of prods) {
    const P = {}; let loaded = true; try { new Function('PRODUCTS', fs.readFileSync(path.join(root, 'catalog', catalogId, p, 'product.js'), 'utf8'))(P); } catch (e) { add('FAIL', p, 'product.js does not load: ' + e.message); loaded = false; }
    const d = P[p]; if (!loaded) continue; if (!d) { add('FAIL', p, `product.js must define PRODUCTS["${p}"]`); continue; }
    const probs = [];
    if (!d.name) probs.push(['FAIL', 'name missing']); if (!(d.angles || []).length) probs.push(['FAIL', 'no pictures in "angles"']);
    for (const a of d.angles || []) { const f = path.join(root, 'catalog', catalogId, p, a);
      if (!fs.existsSync(f)) { probs.push(['FAIL', `picture ${a} is missing`]); continue; }
      const m = probe(f); if (!m) continue;
      if (!alphaFmt.test(m.pf)) probs.push(['FAIL', `${a} has no transparency (${m.pf}): cut it out first (docs/cutout.md)`]);
      if (Math.max(m.w, m.h) < 900) probs.push(['WARN', `${a} is small (${m.w}x${m.h}); it will look soft on a 1080 px post`]); }
    for (const l of ['en', 'pl', 'ru']) { const t = d[l]; if (!t) { probs.push([l === 'en' ? 'FAIL' : 'WARN', `no ${l} texts` + (l === 'en' ? '' : ' (falls back to English)')]); continue; }
      if (!t.desc) probs.push(['WARN', `${l}: desc (subtitle) missing`]); if ((t.chips || []).length !== 3) probs.push(['WARN', `${l}: expects 3 chips, has ${(t.chips || []).length}`]);
      const r = (t.info && t.info.rows) || []; if (r.length !== 4) probs.push(['WARN', `${l}: expects 4 info rows, has ${r.length}`]); if (r.some(x => !Array.isArray(x) || x.length < 2 || !x[1])) probs.push(['FAIL', `${l}: an info row has no value`]);
      if ((t.title || d.name || '').length > 28) probs.push(['WARN', `${l}: title is long (${(t.title || d.name).length} characters), it will be set smaller`]);
      if ([...(t.chips || []), ...r.map(x => x[1])].some(x => String(x).length > 22)) probs.push(['WARN', `${l}: a chip or spec value is over 22 characters, it will be shrunk`]); }
    if (!d.ghost) probs.push(['WARN', 'ghost (short big background word) missing; the first word of the title is used']);
    if (!probs.length) ok++; else for (const [lv, m] of probs) add(lv, p, m);
  }
  add(ok === prods.length ? 'PASS' : 'WARN', 'catalog', `${ok} of ${prods.length} products in catalog/${catalogId} are clean`);
}

// ---------- report ----------
const order = { FAIL: 0, WARN: 1, PASS: 2 }, color = { FAIL: '\x1b[31mFAIL\x1b[0m', WARN: '\x1b[33mWARN\x1b[0m', PASS: '\x1b[32mPASS\x1b[0m' };
rows.sort((a, b) => order[a[0]] - order[b[0]]);
console.log(`Readiness: brand "${id}", catalog "${catalogId}"`);
for (const [l, a, m] of rows) console.log(`${process.stdout.isTTY ? color[l] : l}  ${a.padEnd(10)} ${m}`);
const n = k => rows.filter(r => r[0] === k).length;
console.log(`\n${n('FAIL')} fail, ${n('WARN')} warn, ${n('PASS')} pass` + (n('FAIL') ? '  -> fix the FAILs before showing anything to the client' : n('WARN') ? '  -> warnings are fine to show, but look at them' : '  -> ready'));
if (flag('sheet') && !n('FAIL')) { console.log(`\nrendering ${flag('sheet')} on every template for the look-selection session ...`); execFileSync(process.execPath, [path.join(root, 'studio', 'gallery.mjs'), flag('sheet'), id], { stdio: 'inherit' }); }
process.exit(n('FAIL') ? 1 : 0);
