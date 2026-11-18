# Post Hub

A blank, brand-agnostic hub that turns **a company's catalog + brand kit + a modern template** into stills, videos, GIFs and reels (feed 4:5, square 1:1, story/reel 9:16).

```
catalog/<company>/<product>/   products: pictures + product.js (texts en / pl / ru, chips, specs)
brands/<company>/brand.js      brand kit: colours, fonts, logo, corners, voice, defaults
templates/<id>/template.css    layouts: aurora, bento, editorial, brutal, blueprint, kinetic, soft, split, swiss, stage
carousels/<id>/carousel.css    swipe carousels: panorama, deck, numbered
studio/                        hub page, carousel page, renderers, gallery, tools
```

The repo ships **simulated demo data** (an iPhone 15 to 17 catalog, drawn pictures, three fictional brands) so everything can be tested end to end.
Previews: `docs/previews/`.

## Use it
Install Node 22+, Google Chrome and ffmpeg (`winget install Gyan.FFmpeg` / `brew install ffmpeg`), then:
```bash
node studio/gallery.mjs iphone-16-pro                       # every brand x every template
node studio/render.mjs iphone-17-pro en volt aurora demo    # output/stills/demo.png + output/videos/demo.mp4
node studio/render.mjs iphone-air pl linen editorial reel fmt=9:16 motion=sway --gif
```

## Add a company
1. Copy `brands/_blank/` to `brands/<company>/` and fill the brand code (colours, fonts, logo, radius).
2. Add products to `catalog/<company>/<key>/product.js` + transparent PNG pictures (`node studio/product-pic.mjs <key> <file-or-url>` cleans a photo).
3. `node studio/gallery.mjs <key> <company>` to see the company on every template, then render.

See `CLAUDE.md` for the full map and rules.
