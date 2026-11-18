// Contact sheet: every brand x every template for one product, as stills, to check a brand kit or a new template at a glance.
//   node studio/gallery.mjs [product] [brand]      all brands (or one) x all templates -> output/gallery/<brand>-<template>.png
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dirs = d => fs.readdirSync(path.join(root, d), { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('_')).map(e => e.name);
const [product = 'iphone-16-pro', only] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const out = path.join(root, 'output', 'gallery'); fs.mkdirSync(out, { recursive: true });
for (const b of only ? [only] : dirs('brands')) for (const t of dirs('templates')) {
  execFileSync(process.execPath, [path.join(root, 'studio', 'render.mjs'), product, 'en', b, t, `${b}-${t}`, '--still', `--out=${out}`, 'badge=new'], { stdio: 'inherit' });
}
console.log('gallery:', out);
