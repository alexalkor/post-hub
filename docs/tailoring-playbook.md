# Tailoring playbook

How to take a new client from "interested" to "posts flowing in their own look". For the person running the hub. The client-facing checklist is [client-intake.md](client-intake.md).

## At a glance

| Phase | You | The client gives | Output | Planning effort* |
|---|---|---|---|---|
| 0. Before the call | Open the showcase page | nothing | A client who has seen the idea working | 15 min |
| 1. Intake | Send the intake sheet, read the answers | Brand basics, 5 to 10 products, rules | A complete or knowingly incomplete intake | 1 day of waiting, 30 min of work |
| 2. Brand kit | Fill `brands/<id>/brand.js` | Logo, colours, fonts | A kit that passes `onboard-check` | 1 to 2 h |
| 3. Catalog | Write `product.js` per product, cut out photos | Product facts and photos | A catalog that passes `onboard-check` | 15 to 30 min per product |
| 4. Look selection | Run a 30-minute session on their own products | Their taste | 3 to 5 templates, a motion, a carousel style | 1 h prep, 30 min session |
| 5. First batch and QA | Render, check, fix | Review | A reviewed first batch | 2 to 4 h |
| 6. Handover | Deliver files and the request routine | Approval | Posts in use, a way to ask for more | 1 h |

\* Planning estimates for scheduling, not measurements. Measured on this hub: a still renders in seconds, a 7-second video in about a minute, a photo cut-out takes about 5 seconds. Replace the estimates with real numbers after the first client.

## What the client gets
- A **brand kit**: their colours, fonts, logo, corner style and call-to-action texts in one file, so every template looks like them.
- A **catalog**: their products as files (pictures plus texts in each language) they can extend.
- **Posts, reels, GIFs and carousels** in feed, square and story sizes, in the styles they chose.
- A way to **ask for more** and to change a look without starting over.

## Phase 0. Before the call
- Show the [showcase page](../showcase/index.html): the same product in three brands, then ten styles, a reel, a carousel and a photo cut-out. Let them point at what they like.
- Say plainly what is built (posts, loops, carousels, cut-outs) and what is next (planning, captions, review board, scheduled posting). See the status section of the showcase.
- If you have 15 minutes, put their logo and one product on `brands/_blank` with their main colour to show a first rough look. Label it a sketch.

## Phase 1. Intake
1. Send [client-intake.md](client-intake.md). Ask for a first answer, not a perfect one.
2. Must have: a logo (SVG or large PNG), brand colours or guidelines, three products with any photos, the languages, and the formats they post in.
3. Good to have: fonts, example posts they like and dislike, forbidden words and claims, how people appear in photos.
4. Red flags to settle now: no logo file (a screenshot is not enough for the kit), no product facts in writing (we never invent specs or claims), photos with people who have not agreed to be shown.

## Phase 2. Brand kit
1. `cp -r brands/_blank brands/<client-id>` and rename the key at the top of `brand.js` to `<client-id>`. The header of the file explains every field.
2. Colours: take hex values from the guidelines or sample the logo. You need `bg`, `ink` (text), `accent` and `accent2` (the two brand colours), `surface`, `onAccent` (text on the accent) and softer variants. Dark brand: set `mode: 'dark'`.
3. Fonts: use the brand font if it is on Google Fonts (add one line to `studio/fonts.mjs`, run it). Otherwise pick the nearest match and tell the client. Russian or other Cyrillic text needs a Cyrillic font (Inter is the fallback).
4. Logo: inline SVG that uses `currentColor` in `logo.mark`, and the wordmark in `logo.text`.
5. Voice: `tagline`, `cta` in each language. Use the client's own words; do not write promises ("guaranteed", "best") they have not used.
6. Set `defaults` (template, motion, text intro) to your first guess; Phase 4 finalises it.
7. Run `node studio/onboard-check.mjs <client-id>`. Fix every FAIL (contrast, missing colours, unknown fonts). A WARN is a decision, not an error.

## Phase 3. Catalog
1. One folder per product: `catalog/<client-id>/<key>/`, with `product.js` and pictures `<key>-0.png`, `<key>-1.png`. Copy `catalog/demo-iphones/iphone-16/product.js` as the template.
2. Text rules: facts only from the client's own material. Title up to about 28 characters. Three short chips (under 22 characters). Four spec rows. A short `ghost` word (the model number or a brand word) for the big background text. Write English first, then Polish and Russian if needed; have a native speaker read them.
3. Pictures, by what the client sends (details: [cutout.md](cutout.md)):
   - Transparent PNG: use as is.
   - Product on plain white: `CO=<client-id> node studio/product-pic.mjs <key> <photo> --white`.
   - Anything else (desk, shelf, hands, shadows): `node studio/cutout-ai.mjs <photo> out.png --preview`, open the preview on dark and light, then `product-pic.mjs <key> out.png`.
   - Photos too small (under about 900 px on the long side) or cut off by the frame: ask for another. Do not promise sharp results from a thumbnail.
4. Put the front picture first (`a=0`). Wide or tilted products are fine; the templates adapt.
5. Run `node studio/onboard-check.mjs <client-id>` again. Pictures without transparency, missing texts and over-long values show up here.

## Phase 4. Look selection session (30 minutes)
1. Prepare: `node studio/onboard-check.mjs <client-id> --sheet=<best-product>` renders that product on all ten templates.
2. Start with the three that fit the brand's mood, then show the rest:

| If the brand is | Start with | Why |
|---|---|---|
| Premium tech, dark, few words | aurora, stage | Glow and a hero product |
| Spec-led, technical | blueprint, bento | Callouts and tiles carry facts |
| Warm, lifestyle, fashion | editorial, swiss, soft | Type and calm space |
| Young, loud, sales drops | brutal, kinetic, split | Energy and stickers |

3. Ask for **three picks and one "never"**. Do not show every combination.
4. Pick a motion (float, sway, hover3d, pulse, drift) and a text intro (rise, fade, pop), then a carousel style (panorama for launches, deck for explainers, numbered for editorial brands).
5. Record the decisions in `brands/<client-id>/brand.js` (`defaults`) and in a short `brands/<client-id>/notes.md`: chosen templates, the "never", words to avoid.

## Phase 5. First batch and quality check
Render one post per chosen template, one reel (9:16) and one carousel, on at least two different products.

Checklist before the client sees it:
- [ ] `node studio/onboard-check.mjs <client-id>` has no FAIL.
- [ ] Every product title fits on one or two lines; no text touches an edge or another element.
- [ ] Facts match the client's own material. Nothing invented, no result promises, no competitor names.
- [ ] Cut-outs have clean edges on a dark and a light background; no leftover stands, shadows or halos.
- [ ] Translations read by a native speaker.
- [ ] Videos pass `node studio/check-jumps.mjs <file>`; a loop restarts without a visible jump.
- [ ] A carousel's cover, facts and call to action are on the right slides.
- [ ] Logo is correct and readable on every template used.

## Phase 6. Handover and rhythm
1. Deliver: the rendered files, plus the `brands/<id>` and `catalog/<id>` folders so the look can be reproduced.
2. Explain how to ask for more: "this product, this style, this format, this language".
3. Agree how changes are made: a look change edits only the brand file; a new product is a new folder; a new style is a new template.
4. Collect feedback after the first week and write it into `notes.md`. Repeat requests become defaults.

## Handling client data
This repository is public and holds only simulated demo data. **Never commit a client's logo, photos, product facts or brand file here.** For a real client, work in a private copy of this repository (a private fork) and pull engine updates from this one. Real photos from third parties stay out of Git (see `.gitignore` for `catalog/real-*/`).

## Related
- [cutout.md](cutout.md): cutting out client photos.
- `.claude/skills/onboard-company/SKILL.md`: the same flow as steps for Claude.
- `studio/onboard-check.mjs`: the readiness check used in phases 2, 3, 4 and 5.
