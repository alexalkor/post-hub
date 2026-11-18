// Makes the SIMULATED demo catalog of this repo: iPhone 15 to iPhone 17 as products (catalog/demo-iphones/<key>/).
//   node studio/demo-data.mjs            pictures (front, back, duo) + product.js for every model + _groups.js
//   node studio/demo-data.mjs --texts    product.js and _groups.js only (no Chrome, keeps the pictures)
// The pictures are drawn here (SVG -> transparent PNG with Chrome headless), so there are no copyrighted photos in the repo.
// All numbers are plausible demo values for testing the studio, NOT checked facts. Replace this file's DATA with a real catalog for a real company.
// Real photos: studio/product-pic.mjs <product> <file or URL> adds a picture to a product as angle N.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const prodDir = path.join(here, '..', 'catalog', 'demo-iphones');
const textsOnly = process.argv.includes('--texts');

// key: [name, group, size class (s = 6.1", m = 6.3", l = 6.7"+), back colour, frame colour, lenses (1|2|3|'bar'), wallpaper hue, [chips en], [spec rows en], pro]
const DATA = {
  'iphone-15':         ['iPhone 15',         'i15', 's', '#f1d3d6', '#e6bfc3', 2, 340, ['6.1" OLED', 'A16 Bionic', '48 MP camera'], 0],
  'iphone-15-plus':    ['iPhone 15 Plus',    'i15', 'l', '#cfdbe6', '#b8c9d8', 2, 210, ['6.7" OLED', 'A16 Bionic', '48 MP camera'], 0],
  'iphone-15-pro':     ['iPhone 15 Pro',     'i15', 's', '#b6b0a5', '#8d877d', 3, 30,  ['6.1" OLED', 'A17 Pro', '3x zoom'], 1],
  'iphone-15-pro-max': ['iPhone 15 Pro Max', 'i15', 'l', '#4b5b6e', '#34404f', 3, 215, ['6.7" OLED', 'A17 Pro', '5x zoom'], 1],
  'iphone-16':         ['iPhone 16',         'i16', 's', '#86c3c2', '#6aa9a8', 2, 175, ['6.1" OLED', 'A18', 'Camera Control'], 0],
  'iphone-16-plus':    ['iPhone 16 Plus',    'i16', 'l', '#8c9bf0', '#7283da', 2, 235, ['6.7" OLED', 'A18', 'Camera Control'], 0],
  'iphone-16-pro':     ['iPhone 16 Pro',     'i16', 'm', '#bda58b', '#9c866e', 3, 28,  ['6.3" 120 Hz', 'A18 Pro', '4K 120 fps'], 1],
  'iphone-16-pro-max': ['iPhone 16 Pro Max', 'i16', 'l', '#a9a49b', '#85817a', 3, 200, ['6.9" 120 Hz', 'A18 Pro', '5x zoom'], 1],
  'iphone-16e':        ['iPhone 16e',        'i16', 's', '#f4f4f4', '#dcdcdc', 1, 150, ['6.1" OLED', 'A18', '48 MP camera'], 0],
  'iphone-17':         ['iPhone 17',         'i17', 'm', '#c9bfe6', '#afa3d3', 2, 270, ['6.3" 120 Hz', 'A19', '48 MP Dual'], 0],
  'iphone-air':        ['iPhone Air',        'i17', 'm', '#e9ecf1', '#c9ced6', 1, 190, ['6.5" OLED', 'A19 Pro', '48 MP camera'], 0],
  'iphone-17-pro':     ['iPhone 17 Pro',     'i17', 'm', '#d9742f', '#b85c1d', 'bar', 22, ['6.3" 120 Hz', 'A19 Pro', '3 x 48 MP'], 1],
  'iphone-17-pro-max': ['iPhone 17 Pro Max', 'i17', 'l', '#2f4b7c', '#223a63', 'bar', 220, ['6.9" 120 Hz', 'A19 Pro', '3 x 48 MP'], 1],
};
const GROUPS = {
  i15: { ru: 'Семейство iPhone 15', pl: 'Rodzina iPhone 15', en: 'iPhone 15 family' },
  i16: { ru: 'Семейство iPhone 16', pl: 'Rodzina iPhone 16', en: 'iPhone 16 family' },
  i17: { ru: 'Семейство iPhone 17', pl: 'Rodzina iPhone 17', en: 'iPhone 17 family' },
};
// the subtitle per model type, per language
const DESC = {
  s:   { ru: 'Смартфон с OLED-экраном', pl: 'Smartfon z ekranem OLED', en: 'Smartphone with an OLED display' },
  air: { ru: 'Самый тонкий смартфон', pl: 'Najcieńszy smartfon', en: 'The thinnest smartphone' },
  pro: { ru: 'Про-смартфон для съёмки', pl: 'Smartfon Pro do zdjęć', en: 'Pro smartphone for photo and video' },
};
const L = { // labels for the spec rows
  ru: { screen: 'Экран', chip: 'Чип', camera: 'Камера', colour: 'Цвет', port: 'Порт', pack: 'Комплект', size: 'Размер', check: 'Face ID', profile: 'Корпус', item: 'шт.', head: ['', 'Экран', 'Чип', 'Память'], title: 'Характеристики' },
  pl: { screen: 'Ekran', chip: 'Układ', camera: 'Aparat', colour: 'Kolor', port: 'Port', pack: 'Zestaw', size: 'Rozmiar', check: 'Face ID', profile: 'Obudowa', item: 'szt.', head: ['', 'Ekran', 'Układ', 'Pamięć'], title: 'Specyfikacja' },
  en: { screen: 'Display', chip: 'Chip', camera: 'Camera', colour: 'Colour', port: 'Port', pack: 'In the box', size: 'Size', check: 'Face ID', profile: 'Body', item: 'pcs', head: ['', 'Display', 'Chip', 'Storage'], title: 'Specifications' },
};
const STORAGE = '128 / 256 / 512 GB';

function info(key, lang, d) {
  const chips = d[7], l = L[lang];
  return { title: l.title, rows: [[l.screen, chips[0]], [l.chip, chips[1]], [l.camera, chips[2]], [l.colour, '5']] };
}

function writeTexts() {
  fs.mkdirSync(prodDir, { recursive: true });
  fs.writeFileSync(path.join(prodDir, '_groups.js'), `/* Product groups of this demo catalog (made by studio/demo-data.mjs). */
var PRODUCT_GROUPS = ${JSON.stringify(GROUPS, null, 2)};
`);
  for (const [key, d] of Object.entries(DATA)) {
    const [name, group, size, , , lenses, , chips, pro] = d;
    const dir = path.join(prodDir, key); fs.mkdirSync(dir, { recursive: true });
    const P = { name, group, ghost: name.replace('iPhone ', '').split(' ')[0], shape: 'tall', brand: true, angles: [`${key}-0.png`, `${key}-1.png`, `${key}-2.png`] };
    for (const lang of ['ru', 'pl', 'en']) P[lang] = { desc: DESC[pro ? 'pro' : key === 'iphone-air' ? 'air' : 's'][lang], group: GROUPS[group][lang], chips, info: info(key, lang, d) };
    fs.writeFileSync(path.join(dir, 'product.js'),
`/* ${name}: SIMULATED demo product (studio/demo-data.mjs), not a checked fact.
   angles: 0 = front, 1 = back, 2 = front + back ("duo"); picked with a=<index>. */
PRODUCTS[${JSON.stringify(key)}] = ${JSON.stringify(P, null, 2)};
`);
  }
}

// ---------- pictures ----------
const BW = { s: 560, m: 580, l: 620 };
function phone(key, kind, uid) { // returns {svg, w, h}: one phone drawn at 0,0
  const [, , size, back, frame, lenses, hue, , pro] = DATA[key];
  const w = BW[size], h = Math.round(w * (size === 'l' ? 2.06 : 2.04)), r = 96, id = key + kind + uid;
  const dark = c => c; // frame colours are already chosen per model
  let s = `<defs>
  <linearGradient id="f${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="${frame}"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
  <linearGradient id="b${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="${back}"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
  <radialGradient id="g${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#3a4a66"/><stop offset=".45" stop-color="#0b0f1a"/><stop offset="1" stop-color="#000"/></radialGradient>
  <linearGradient id="w${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},85%,62%)"/><stop offset=".55" stop-color="hsl(${(hue + 40) % 360},80%,45%)"/><stop offset="1" stop-color="hsl(${(hue + 300) % 360},70%,22%)"/></linearGradient>
  <linearGradient id="s${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="c${id}"><rect x="16" y="16" width="${w - 32}" height="${h - 32}" rx="${r - 16}"/></clipPath>
</defs>
<rect width="${w}" height="${h}" rx="${r}" fill="url(#f${id})"/>`;
  if (kind === 'front') {
    s += `<rect x="8" y="8" width="${w - 16}" height="${h - 16}" rx="${r - 8}" fill="#05070b"/>
<g clip-path="url(#c${id})"><rect x="16" y="16" width="${w - 32}" height="${h - 32}" fill="url(#w${id})"/>
  <circle cx="${w * .3}" cy="${h * .62}" r="${w * .38}" fill="hsl(${(hue + 80) % 360},90%,70%)" opacity=".35"/>
  <circle cx="${w * .75}" cy="${h * .78}" r="${w * .3}" fill="hsl(${(hue + 200) % 360},90%,60%)" opacity=".3"/>
  <text x="${w / 2}" y="${h * .27}" font-family="Manrope,Segoe UI,Arial,sans-serif" font-weight="300" font-size="${w * .26}" text-anchor="middle" fill="#fff" fill-opacity=".92">9:41</text>
  <text x="${w / 2}" y="${h * .27 - w * .27}" font-family="Manrope,Segoe UI,Arial,sans-serif" font-weight="600" font-size="${w * .05}" text-anchor="middle" fill="#fff" fill-opacity=".8">Mon 17 November</text>
  <rect x="${w * .08}" y="${h * .86}" width="${w * .84}" height="${h * .085}" rx="${w * .07}" fill="#fff" fill-opacity=".22"/>
  <rect x="${w * .38}" y="${h - 46}" width="${w * .24}" height="9" rx="4.5" fill="#fff" fill-opacity=".85"/>
  <rect x="16" y="16" width="${w - 32}" height="${h - 32}" fill="url(#s${id})"/></g>
<rect x="${w / 2 - w * .12}" y="38" width="${w * .24}" height="${w * .07}" rx="${w * .035}" fill="#000"/>`;
  } else {
    s += `<rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="${r - 3}" fill="url(#b${id})"/>`;
    const lens = (cx, cy, rad) => `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="#1b1d22"/><circle cx="${cx}" cy="${cy}" r="${rad * .84}" fill="url(#g${id})" stroke="#9aa0aa" stroke-opacity=".5" stroke-width="3"/><circle cx="${cx - rad * .25}" cy="${cy - rad * .28}" r="${rad * .13}" fill="#fff" fill-opacity=".55"/><circle cx="${cx + rad * .22}" cy="${cy + rad * .25}" r="${rad * .06}" fill="#6f8fff" fill-opacity=".6"/>`;
    const flash = (cx, cy, rad) => `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="#f6efd6" fill-opacity=".9" stroke="#0003" stroke-width="2"/>`;
    const plate = (x, y, pw, ph) => `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="${w * .1}" fill="#fff" fill-opacity="${pro ? .22 : .16}" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`;
    if (lenses === 'bar') {
      const bh = h * .17, by = 52; s += plate(36, by, w - 72, bh);
      s += [0, 1, 2].map(i => lens(w * (.22 + i * .28), by + bh / 2, w * .085)).join('') + flash(w * .84 - 8, by + bh * .3, w * .02);
    } else if (lenses === 3) {
      const pw = w * .46; s += plate(40, 40, pw, pw);
      s += lens(40 + pw * .3, 40 + pw * .3, w * .085) + lens(40 + pw * .3, 40 + pw * .72, w * .085) + lens(40 + pw * .7, 40 + pw * .52, w * .085) + flash(40 + pw * .72, 40 + pw * .18, w * .022);
    } else if (lenses === 2) {
      const pw = w * .4; s += plate(40, 40, pw, pw);
      s += lens(40 + pw * .3, 40 + pw * .3, w * .085) + lens(40 + pw * .7, 40 + pw * .7, w * .085) + flash(40 + pw * .72, 40 + pw * .24, w * .022);
    } else {
      s += plate(40, 40, w * .24, w * .2) + lens(40 + w * .12, 40 + w * .1, w * .075);
    }
    s += `<circle cx="${w / 2}" cy="${h * .55}" r="${w * .055}" fill="#fff" fill-opacity=".18"/>`;
  }
  // side buttons
  s += `<rect x="-5" y="${h * .2}" width="6" height="${h * .05}" rx="3" fill="${frame}"/><rect x="${w - 1}" y="${h * .28}" width="6" height="${h * .09}" rx="3" fill="${frame}"/>`;
  return { svg: s, w, h };
}

function chromePath() {
  const lad = process.env.LOCALAPPDATA || '', home = os.homedir();
  return process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', path.join(lad, 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(fs.existsSync);
}
function shot(svgInner, w, h, out, tmp) {
  const html = `<!doctype html><html><body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svgInner}</svg></body></html>`;
  const f = path.join(tmp, 'p.html'); fs.writeFileSync(f, html);
  execFileSync(chromePath(), ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000', `--window-size=${w},${h}`, `--screenshot=${out}`, pathToFileURL(f).href], { stdio: 'ignore' });
}

function writePictures() {
  const chrome = chromePath(); if (!chrome) throw new Error('Chrome not found (set CHROME).');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'phones-'));
  const pad = 30;
  for (const key of Object.keys(DATA)) {
    const dir = path.join(prodDir, key);
    const f = phone(key, 'front', 'a'), b = phone(key, 'back', 'b');
    shot(`<g transform="translate(${pad},${pad})">${f.svg}</g>`, f.w + 2 * pad, f.h + 2 * pad, path.join(dir, `${key}-0.png`), tmp);
    shot(`<g transform="translate(${pad},${pad})">${b.svg}</g>`, b.w + 2 * pad, b.h + 2 * pad, path.join(dir, `${key}-1.png`), tmp);
    // duo: back phone behind and left, tilted; front phone in front and right
    const f2 = phone(key, 'front', 'c'), b2 = phone(key, 'back', 'd'), W = Math.round(f2.w * 1.85), H = Math.round(f2.h * 1.12);
    shot(`<g transform="translate(${W * .05},${H * .07}) rotate(-7 ${b2.w / 2} ${b2.h / 2})">${b2.svg}</g><g transform="translate(${W - f2.w - W * .06},${H * .05}) rotate(5 ${f2.w / 2} ${f2.h / 2})">${f2.svg}</g>`, W, H, path.join(dir, `${key}-2.png`), tmp);
    console.log('pictures', key);
  }
}

writeTexts();
if (!textsOnly) writePictures();
console.log('Done: catalog/demo-iphones/');
