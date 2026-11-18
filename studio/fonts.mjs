// Keeps the post fonts in Git (studio/fonts/), so renders look the same offline, in the cloud and on every PC.
//   node studio/fonts.mjs      download again (only after adding a font below or to refresh)
// Per font: <key>.css (@font-face rules) + one .woff2 per alphabet (Cyrillic, Latin, Latin extended for Polish). Source: Google Fonts (open licence, OFL).
// A new brand font: add one line to FONTS (key: 'Google+Family:axes'), run this, then use the key's family name in brands/<id>/brand.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FONTS = {
  inter: 'Inter:wght@400..800',
  spacegrotesk: 'Space+Grotesk:wght@400..700',
  bricolage: 'Bricolage+Grotesque:wght@500..800',
  instrumentserif: 'Instrument+Serif:ital@0;1',
  jetbrainsmono: 'JetBrains+Mono:wght@400..700',
  unbounded: 'Unbounded:wght@500..800',
  playfair: 'Playfair+Display:wght@600..800',
};
const KEEP = ['cyrillic-ext', 'cyrillic', 'latin-ext', 'latin'];
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';   // a modern browser gets woff2
fs.mkdirSync(out, { recursive: true });
for (const [key, family] of Object.entries(FONTS)) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&display=swap`, { headers: { 'User-Agent': UA } })).text();
  let local = '', n = 0;
  for (const [, subset, face] of css.matchAll(/\/\* ([a-z-]+) \*\/\s*(@font-face \{[^}]+\})/g)) {
    if (!KEEP.includes(subset)) continue;
    const um = face.match(/url\((https:[^)]+)\)/);
    if (!um) { console.log('skip', key, subset); continue; }
    const url = um[1], file = `${key}-${subset}-${n++}.woff2`;
    fs.writeFileSync(path.join(out, file), Buffer.from(await (await fetch(url)).arrayBuffer()));
    local += face.replace(url, file) + '\n';
  }
  if (!local) throw new Error(`No fonts found for ${key}: check the family name`);
  fs.writeFileSync(path.join(out, `${key}.css`), local);
  console.log(`${key}: ${local.match(/@font-face/g).length} files`);
}
