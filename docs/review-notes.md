# Review notes

A snapshot for whoever reviews this project next. Facts as of the last commit; check against the code.

## What exists
- **Engine**: `studio/hub.html` + `studio/base.css` (one post page), `studio/render.mjs` (still, 7 s video, GIF, final/master), `studio/carousel.html` + `carousel.mjs` (swipe slides), `studio/gallery.mjs` (brand x template sheet).
- **Looks**: 10 post templates (`templates/`), 3 carousel templates (`carousels/`), 3 fictional brand kits + a blank one (`brands/`), 13 simulated products (`catalog/demo-iphones/`, pictures drawn by `studio/demo-data.mjs`).
- **Photos**: `studio/cutout-ai.mjs` (local AI, installed outside the repo), `studio/cutout.mjs` (no-install fallback), `studio/product-pic.mjs` (trim, white keying), `studio/fetch-real-photos.mjs`, `studio/fetch-messy-test.mjs` (regression set of 8 messy photos, not in Git).
- **Presentation**: `showcase/index.html` + `showcase/build-assets.mjs`.
- **Onboarding**: `docs/tailoring-playbook.md`, `docs/client-intake.md`, `docs/cutout.md`, `studio/onboard-check.mjs` (readiness check), skills in `.claude/skills/`.

## How it was verified (by eye and by command, no automated test suite)
- 30 stills (3 brands x 10 templates) and 15 carousel decks looked at; 8 sample videos passed `studio/check-jumps.mjs`.
- 8 messy photos cut out with the AI model and run through 8 templates, 1 video and 2 carousels.
- `studio/onboard-check.mjs`: passes the demo kits, reports 10 failures on a deliberately broken kit.
- Showcase page checked at desktop and phone width, light and dark.

## Known gaps and risks
- **Not built yet**: pitch generator, content planning, captions, review board, scheduled posting (README roadmap 3 to 5).
- **No automated tests or CI.** Regressions are caught only by re-running the galleries and `fetch-messy-test.mjs` by hand.
- **Showcase videos** were not confirmed to play in the published shareable copy (they play from the repo copy).
- **Layout limits**: templates were designed for tall products and adapt to wide ones through `adaptProd()` in `hub.html` / `carousel.html`. Very long titles or spec values shrink rather than wrap nicely. Some labels sit close to shapes (for example the `split` template's spec labels near its diagonal on some brands).
- **Carousels are PNG slides only**; no swipe video or GIF export.
- **Cut-out AI** needs a one-time install (about 330 MB) and, on Windows without the Visual C++ runtime, a DLL workaround (docs/cutout.md). The no-install fallback is clearly weaker (fails on thin cables, needs flags).
- **Playbook effort figures are planning estimates**, not measurements, except render and cut-out times.
- **Skills not audited**: `motion-design`, `sales-post-styles`, `story-formats`, `style-explorer` were carried over from an earlier project and only lightly edited; they may describe workflows this repo does not have.
- **Demo data is simulated.** Product names are real phone model names used as examples; specs are plausible, not checked.
- **History**: both repositories were squashed and force-pushed once; older commits and pull requests (#1 to #6 on the private repo) can still be opened by SHA until GitHub collects them.
- **Public repository**: never commit a client's logo, photos, facts or brand file here (see the playbook, "Handling client data").
