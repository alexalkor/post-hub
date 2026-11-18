// "Not ideal photos" regression test: fetches 8 openly licensed, deliberately messy product photos (desk, bedsheet, shop shelf, white backdrop, thin cables),
// cuts each out with studio/cutout.mjs (or the white-keying of product-pic.mjs) using the settings that worked for it, and builds catalog/real-messy/.
//   node studio/fetch-messy-test.mjs
// Not in Git (third-party licences, see .gitignore catalog/real-*/). Attribution: catalog/real-messy/ATTRIBUTION.md. Preview of every cut-out: catalog/real-messy/_cutouts/<key>-preview.png
// Use it after changing studio/cutout.html or cutout-ai.mjs: every item should end OK or CHECK (never FAIL) and look right in its preview.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), here = path.join(root, 'studio'), out = path.join(root, 'catalog', 'real-messy');
const UA = { 'User-Agent': 'post-hub/1.0 (local experiment; openly licensed images)' };
// key: [commons title, product name, [classic cutout.mjs arguments], what is hard about it, [AI cutout-ai.mjs arguments]]
// The AI cut-out (studio/cutout-ai.mjs) is used when it is installed (~/.post-hub/cutout), else the no-install cutout.mjs.
const ITEMS = {
  'phone-on-wood': ['File:IPhone 17 Pro (2025-12-28).jpg', 'Phone on wood', [], 'wood grain background'],
  'phone-clear-case': ['File:IPhone 16 Pro Max in a Glossy Clear Case.jpg', 'Phone in clear case', ['--hull'], 'bedsheet texture, glossy reflections inside a clear case'],
  'phone-wallet-case': ['File:Blackview A60 Smartphone Android mobile phone and folio case.jpg', 'Phone in wallet case', [], 'light screen looks like the backdrop'],
  'phone-on-shelf': ['File:Silver iPhone 17 Pro Max.jpg', 'Phone on a shop stand', [], 'crowd and blur behind, stand below', ['--crop=0,0,1,0.9', '--clean']],
  'phone-on-shelf-blue': ['File:Deep Blue iPhone 17 Pro Max.jpg', 'Phone on a shop stand (blue)', [], 'crowd and blur behind, stand below', ['--crop=0,0,1,0.9', '--clean']],
  'headphones': ['File:MDR-ZX310.jpg', 'Headphones', ['--bg=white', '--close=8', '--hole=0.06'], 'product touches the photo edge, soft shadows on the wall', ['--clean']],
  'earbuds-case': ['File:Thinkplus LivePods LP40pro.jpg', 'Earbuds case', [], 'several objects on a wood desk', ['--clean']],
  'earbuds-wired': ['File:LG QuadBeat 3.jpg', 'Wired earbuds', 'white', 'thin cables on a white background', []],
};
const j = await (await fetch('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600&titles=' + encodeURIComponent(Object.values(ITEMS).map(v => v[0]).join('|')), { headers: UA })).json();
const info = {}; for (const p of Object.values(j.query.pages)) info[p.title.replace(/_/g, ' ')] = p.imageinfo[0];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'messy-')), rows = [['Item', 'Result', 'Notes']], attribution = ['# Photo attribution (catalog/real-messy)', ''];
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, '_cutouts'), { recursive: true });
const ai = fs.existsSync(path.join(process.env.POST_HUB_CUTOUT || path.join(os.homedir(), '.post-hub', 'cutout'), 'node_modules')); console.log(ai ? 'cut-out: AI model (studio/cutout-ai.mjs)' : 'cut-out: no-install tool (studio/cutout.mjs); the AI model is not installed');
for (const [key, [title, name, how0, hard, aiArgs = []]] of Object.entries(ITEMS)) {
  const how = how0 === 'white' && ai ? aiArgs : how0;
  const i = info[title], m = i.extmetadata, photo = path.join(tmp, key + '.jpg');
  fs.writeFileSync(photo, Buffer.from(await (await fetch(i.thumburl || i.url, { headers: UA })).arrayBuffer()));
  const dir = path.join(out, key); let verdict;
  if (how0 === 'white' && !ai) { execFileSync(process.execPath, [path.join(here, 'product-pic.mjs'), key, photo, '--white'], { env: { ...process.env, CO: 'real-messy' }, stdio: 'ignore' }); verdict = 'OK (white keying)'; }
  
  else {
    const cut = path.join(out, '_cutouts', key + '.png');
    if (ai) { execFileSync(process.execPath, [path.join(here, 'cutout-ai.mjs'), photo, cut, ...aiArgs, '--preview'], { stdio: 'ignore' }); verdict = 'OK (AI)'; }
    else verdict = execFileSync(process.execPath, [path.join(here, 'cutout.mjs'), photo, cut, ...how0, '--preview'], { encoding: 'utf8' }).split('\n')[0].split(':')[0];
    execFileSync(process.execPath, [path.join(here, 'product-pic.mjs'), key, cut], { env: { ...process.env, CO: 'real-messy' }, stdio: 'ignore' });
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort();
  const t = { desc: 'Photo cut-out test', group: 'Not ideal photos', chips: [hard.split(',')[0], 'cut-out test', 'demo'], info: { title: 'Specifications', rows: [['Photo', 'not studio'], ['Problem', hard.split(',')[0]], ['Cut-out', verdict], ['Source', 'Wikimedia Commons']] } };
  const P = { name, group: 'tests', ghost: name.split(' ')[0], shape: 'tall', brand: true, angles: files, en: t, pl: t, ru: t, source: { title, page: i.descriptionurl, license: m.LicenseShortName?.value, author: (m.Artist?.value || '').replace(/<[^>]+>/g, '').trim() } };
  fs.writeFileSync(path.join(dir, 'product.js'), `/* ${name}: REAL photo (${P.source.license}, ${P.source.author}); a cut-out test case: ${hard}. */\nPRODUCTS[${JSON.stringify(key)}] = ${JSON.stringify(P, null, 2)};\n`);
  attribution.push(`- ${name}: "${title.replace('File:', '')}" by ${P.source.author}, ${P.source.license}, ${P.source.page}`);
  rows.push([key, verdict, hard]); console.log(key.padEnd(22), verdict.padEnd(18), hard);
}
fs.writeFileSync(path.join(out, 'ATTRIBUTION.md'), attribution.join('\n') + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
