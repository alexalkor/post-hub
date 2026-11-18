---
name: onboard-company
description: Add a new company to the post hub - build its brand kit from a brand code or website and its catalog from product files, then preview it on every template. Use when a company uploads its catalog or brand guidelines, or the user says "new brand", "new client", "add company".
---

# Onboard a company

1. **Names.** Folder id = short lowercase name (`acme`). Do not put real company data into the demo folders; if this repo is shared, ask whether the company's data may live here or belongs in a private copy.
2. **Brand kit.** Copy `brands/_blank/` to `brands/<id>/`, rename the key in `brand.js`, fill it from the brand code (colours with hex values, fonts, corner radius, logo). Rules of thumb:
   - `bg` / `ink` must have strong contrast (dark brand: `mode: 'dark'`, light `ink` on dark `bg`). `accent` + `onAccent` must be readable together.
   - Fonts: pick from `studio/fonts.mjs`; if the brand font is on Google Fonts add one line and run it; otherwise choose the closest match and say so. Cyrillic needs Inter or another Cyrillic font as the body.
   - Logo: inline SVG with `currentColor` in `logo.mark` (or empty for a wordmark).
   - `defaults.tpl`: the template that suits the mood (see the look guide in the `hub-post` skill).
3. **Catalog.** For each product: `catalog/<id>/<key>/product.js` (copy one from `catalog/demo-iphones/`: name, `ghost` = a short big word for editorial/bento, group, `en/pl/ru` with desc, 3 `chips`, `info.rows` of 4 `[label, value]`) and pictures as transparent PNGs:
   `CO=<id> node studio/product-pic.mjs <key> <file-or-url>` (removes a white background, trims, appends to `angles`). Facts only from the company's own catalog. Missing translations fall back to English.
4. **Preview.** `node studio/gallery.mjs <key> <id>` renders the product on all templates; look at every one (text fit, contrast, logo, product size). Fix the kit, not the templates, unless a template really breaks.
5. **Deliver.** Render 3 sample posts (different templates) and one reel. Commit on a branch `claude/onboard-<id>`.

## Client photos are rarely clean: cut-out routes (details and test results: `docs/cutout.md`)
1. Transparent PNG already: use as is. Product on plain white: `product-pic.mjs <key> <photo> --white`.
2. Anything else (desk, shelf, hands, shadows, thin parts): `node studio/cutout-ai.mjs <photo> out.png --preview [--crop=..] [--clean]`, **open the preview**, then `CO=<id> node studio/product-pic.mjs <key> out.png`.
   If the AI model is not installed: install it once (docs/cutout.md) or use `studio/cutout.mjs` (weaker; flags `--hull`, `--bg=white`, `--all`, `--box`, `--roi`).
3. Look at every cut-out on a dark and a light background for halos, missing parts (thin cables, glass) and left-over stands or shadows. Fix with `--crop`, `--clean`, or ask the client for a better photo.
4. Wide or tilted products are fine: the hub widens the product box automatically. Front + back in one picture: split at the empty column (see `studio/fetch-real-photos.mjs`), front first so `a=0` is the front.
5. Third-party photos: check the licence, keep them out of Git, record author and licence next to them. A company's own photos can live in its private catalog folder.
