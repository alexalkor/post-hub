---
name: hub-post
description: Make social posts (still PNG, 7-second MP4, GIF, reel or story) from a company's catalog, brand kit and a modern template with the post hub. Use whenever the user asks for a post, still, video, reel, GIF or new look for a product, or wants to compare templates or brands.
---

# Make a post with the hub

Inputs: **product** (`catalog/<company>/<key>/`), **brand** (`brands/<id>/`), **template** (`templates/<id>/`). Any combination works.

1. Ask only what is missing: which product(s), which brand, which format (feed 4:5, square 1:1, story or reel 9:16), language (en, pl, ru). Defaults: the brand's own template and motion.
2. Make 2 to 3 **stills** first (`--still`), show them, let the user pick. Different templates for the same product is the normal way to choose.
   `node studio/render.mjs <product> <lang> <brand> <template> <name> --still [settings]`
3. For the picked ones make the video (drop `--still`), a GIF (`--gif`) or a reel (`fmt=9:16`). Run `node studio/check-jumps.mjs output/videos/<name>.mp4`.
4. Files land in `output/stills`, `output/videos`. Tell the user the paths. Nothing is posted by Claude.

Settings (all optional, `key=value`): `motion=float|sway|hover3d|pulse|drift|none`, `tm=rise|fade|pop|none`, `fmt=4:5|3:4|1:1|9:16`, `a=<picture index>`,
`title= sub= c1..c3= n=0-4 cta= badge=new|hit|<text> ghost= url= co=<catalog>`. `random` works for product, brand, template, motion and tm.

Look guide (10 templates):
- **aurora** dark glow, centred, premium (hero product, few words) | **stage** launch podium, spotlight sweep, floating spec cards (hero reveal)
- **bento** tiles, calm, informative (specs) | **swiss** grid poster, huge flush-left title, cropped product, spec table (quiet, confident)
- **editorial** big type, rules, stamp (fashion, lifestyle) | **blueprint** technical callouts (spec-led, industrial)
- **brutal** loud stickers + ticker, young, sales drops (add `badge=`) | **kinetic** outlined giant word + moving ticker band (reels, drops)
- **soft** clay/soft-3D platform and pill chips (friendly, light brands) | **split** diagonal colour block, stacked title, stat list (sporty, bold)
Match the brand's mood: dark neon on `aurora`/`stage`/`blueprint`, warm serif on `editorial`/`swiss`/`soft`, loud on `brutal`/`kinetic`/`split`.

Rules: facts only from `product.js`; no "cheap", no promises of results; keep the brand's voice (`brands/<id>/brand.js`). A new template or motion: see `CLAUDE.md` rule 4 and `studio/base.css`; check it on every brand with `node studio/gallery.mjs`.

## Carousels (swipe posts)
`node studio/carousel.mjs <product> <lang> <brand> <carousel> [name] [plan=...]` writes `output/carousels/<name>/slide-1..N.png` (1080x1350) and `sheet.png`.
Default plan: `cover, fact:0, fact:1, fact:2, angles:2, cta` (6 slides). Other types: `specs` (all 4 spec rows), `angles:<picture index>`; any order, 2 to 10 slides.
- **panorama**: one continuous picture; the product sits half on the cover and its other half appears on slide 2 when swiped. Premium, for launches.
- **deck**: a rounded card per slide with the same header and a progress bar. Clear, for explainers and spec comparisons.
- **numbered**: editorial pages with a huge page number and one big fact per page. For lifestyle and fashion brands.
Show the `sheet.png` first, then deliver the slides. Check every slide for text fit (long specs wrap) and that the swipe hint and CTA are on the right slides. A new carousel template = a folder `carousels/<id>/carousel.css` using the same slide classes (`.cover .fact .specs .angles .cta`, `.hd .logo .count`, `.dots`); see `studio/carousel.html`.
