# Cutting out client photos (not-ideal product pictures)

Clients rarely send studio cut-outs. The hub needs a transparent PNG per product picture. Pick the route by what the photo looks like:

| Photo | Route | Command |
|---|---|---|
| Already a transparent PNG | use as is | `CO=<company> node studio/product-pic.mjs <key> <png>` |
| Product on plain white | white keying | `CO=<company> node studio/product-pic.mjs <key> <photo> --white` |
| Anything else: desk, bedsheet, shop shelf, hands, shadows, thin parts | **AI cut-out** (local model, no cloud, ~5 s per photo) | `node studio/cutout-ai.mjs <photo> out.png --preview [--crop=0,0,1,0.9] [--clean]` then `product-pic.mjs <key> out.png` |
| AI not installed yet | no-install cut-out (Chrome only; weaker) | `node studio/cutout.mjs <photo> out.png --preview [--hull] [--bg=white] [--all] [--box=..] [--roi=..]` |

Always open the `-preview.png` (original, cut-out on magenta, cut-out on dark) before using a cut-out.

## Install the AI cut-out once (about 330 MB, outside the repo)
```bash
mkdir -p ~/.post-hub/cutout && cp tools/cutout/package.json ~/.post-hub/cutout/ && cd ~/.post-hub/cutout && npm install
```
- It lives in `~/.post-hub/cutout` (override: `POST_HUB_CUTOUT`), not in the repo and not in a cloud-synced folder.
- Windows without the Visual C++ runtime: loading fails with "The specified module could not be found" for `onnxruntime_binding.node`. Install the runtime (the x64 "VC++ 2015-2022 redistributable") or copy `msvcp140.dll`, `vcruntime140.dll`, `vcruntime140_1.dll` from another program that ships them next to that file in `~/.post-hub/cutout/node_modules/onnxruntime-node/bin/napi-v3/win32/x64/`.
- npm 11 may list "install-scripts not covered": the package works without approving them.

## What the test showed (`node studio/fetch-messy-test.mjs`, 8 openly licensed messy photos, not in Git)
| Photo | No-install tool | AI model |
|---|---|---|
| Phone on a wood desk | good | good |
| Phone in a glossy clear case on a quilted bedsheet | needs `--hull` (reflections) | good |
| Phone in a wallet case, screen as light as the backdrop | good | good (leather slightly see-through) |
| Phone on a shop stand, crowd behind | good, stand stub left | good; use `--crop=0,0,1,0.9` to drop the stand |
| Headphones touching the photo edge, shadows on the wall | needs `--bg=white`, leftovers | good (`--clean` removes faint shadows) |
| Earbuds case + two earbuds on wood | wood bridges the items | good (soft shadows stay; `--clean`) |
| Wired earbuds, thin cables on white | fails | good, cables kept (white keying also works) |

Findings for the templates (fixed in the hub): wide or tilted products used to be cropped by boxes made for tall phones, so `hub.html` and `carousel.html` now give wide products
a wider, shorter box around the same centre; long spec values shrink to fit. Still to expect: soft shadows come with the cut-out (use `--clean`), mirrors and glass keep some background,
a product cut by the photo edge stays cut.
