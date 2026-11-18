# Post Hub: read me first

## What this repo is
A **blank hub for social content**. A company brings three things; the hub turns them into stills, videos, GIFs and reels:
1. **Catalog**: its products (pictures + texts) in `catalog/<company>/<product>/`
2. **Brand kit**: its brand code (colours, fonts, logo, voice, corner style) in `brands/<company>/brand.js`
3. **Template**: a layout family from `templates/` (modern 2026 styles, 10 so far: aurora, bento, editorial, brutal, blueprint, kinetic, soft, split, swiss, stage; more to come)

Any product x any brand x any template works. The shipped content is **simulated demo data**: an iPhone 15 to 17 catalog (`catalog/demo-iphones/`) and three fictional brands
(`volt` dark neon, `linen` warm editorial, `pop` neo-brutal). Nothing here is a real company, a real spec or a real photo.
The templates are deliberately generic and brand-neutral: a company's look comes only from its brand kit.

## Map
| Path | What it is |
|---|---|
| `catalog/<company>/<key>/` | `product.js` (name, ghost word, group, texts in en / pl / ru, 3 chips, 4 spec rows) + pictures `<key>-<n>.png` (transparent PNG cut-outs). `catalog/demo-iphones/` is made by `node studio/demo-data.mjs`. |
| `brands/<company>/brand.js` | Brand kit: colours, fonts, radius, grain, logo, CTA texts, defaults. `brands/_blank/` is the empty kit to copy; its header explains every field. |
| `templates/<id>/template.css` | One layout family. Only places and styles the shared elements; uses brand variables only, so it fits every brand. |
| `showcase/` | The client presentation page (`index.html`, static, no build step) and its examples in `assets/` (small jpg and mp4). `node showcase/build-assets.mjs [looks|video|carousel|cutout]` re-renders them from the hub. Keep claims on the page true to what works; the status section lists what is built and what is next. |
| `studio/hub.html` | The one page all posts render from (URL settings are listed in its header). `studio/base.css`: shared base, motions (float, sway, hover3d, pulse, drift), text intros (rise, fade, pop). |
| `studio/render.mjs` | `node studio/render.mjs <product> <lang> <brand> <template> [name] [k=v ...]` makes `output/stills/<name>.png` + `output/videos/<name>.mp4` (7 s loop; `--still`, `--gif`, `--final`, `--master`, `fmt=9:16` for reels, `--out=`). |
| `carousels/<id>/carousel.css` + `studio/carousel.html` + `studio/carousel.mjs` | **Carousels** (swipe posts, 1080x1350 slides): `node studio/carousel.mjs <product> <lang> <brand> <carousel> [name] [plan=cover,fact:0,fact:1,fact:2,angles:2,cta]` -> `output/carousels/<name>/slide-N.png` + `sheet.png`. Slide types: cover, fact:<row>, specs, angles:<picture>, cta. Carousel templates: `panorama` (one picture continuing across slide edges), `deck` (rounded cards + progress bar), `numbered` (editorial pages, huge numerals). |
| `studio/gallery.mjs` | Contact sheet: every brand x every template for one product. Run it after changing a brand kit or a template. |
| `studio/check-jumps.mjs` | Flags frame jumps in a rendered video. |
| `studio/fonts.mjs` | Keeps brand fonts in Git (`studio/fonts/`, Google Fonts, OFL). Add a font = one line. |
| `studio/product-pic.mjs` | Adds a real product picture (file or URL, background made transparent, trimmed). |
| `studio/fetch-real-photos.mjs` | Fetches 4 openly licensed iPhone photos (Wikimedia Commons, CC BY / CC BY-SA, already transparent) into `catalog/real-iphones/` with attribution (`ATTRIBUTION.md`). **Not in Git** (third-party licences); run it to get them. Use: `node studio/render.mjs iphone-15 en volt aurora x co=real-iphones`. Texts are still demo values. |
| `studio/cutout-ai.mjs`, `studio/cutout.mjs`, `docs/cutout.md` | **Cutting out client photos.** `cutout-ai.mjs` = local AI model (install once into `~/.post-hub/cutout`, ~330 MB, not in Git): works on busy backgrounds. `cutout.mjs` = no-install fallback that runs in Chrome. Both write a `-preview.png` to check. Routes by photo type and the test results: `docs/cutout.md`. `studio/fetch-messy-test.mjs` re-runs the 8-photo regression test into `catalog/real-messy/` (not in Git). |
| `studio/demo-data.mjs` | Builds the simulated iPhone catalog and its drawn pictures (no photos). |
| `.claude/skills/` | `hub-post` (make posts), `onboard-company` (new company: catalog + brand kit), craft guides: `motion-design`, `sales-post-styles`, `story-formats`, `style-explorer`. |
| `output/` | Generated files. Never in Git. |

## Rules
1. Never put real customer, price or contact data in demo files. A real company gets its own `catalog/<company>/` and `brands/<company>/`; keep real data in a private repo.
2. Product facts come from the catalog's `product.js` only. Never invent specs; demo values are marked simulated.
3. Templates must stay brand-neutral: colours, fonts, radius and logo come from CSS variables, never hard-coded in a template.
4. A new look = a new folder in `templates/<id>/` (CSS only if it can reuse the shared elements; extend `hub.html` if it needs a new element) plus a line in the table above; run `node studio/gallery.mjs` and look at all brands.
5. Motions loop in 7 s or 3.5 s and rest at the start, so videos loop without a jump. Run `check-jumps.mjs` on a video.
6. Nothing is posted by Claude. Generated files stay in `output/`.
7. Never use the real projects' secrets here.

## How to work
Plan, a few examples, then final. Keep answers short. Git: branch `claude/<topic>`, PR, merge when green; never commit to `main`.
Needs Node 22+, Google Chrome, ffmpeg (videos).

## Quick start
```bash
node studio/gallery.mjs iphone-16-pro                     # 15 looks (3 brands x 5 templates) into output/gallery/
node studio/render.mjs iphone-17-pro en volt aurora demo  # still + 7 s video
node studio/render.mjs iphone-air pl linen editorial reel fmt=9:16 motion=sway --gif
```
