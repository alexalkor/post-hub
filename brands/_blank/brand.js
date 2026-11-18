/* BLANK BRAND KIT: copy this folder to brands/<your-company>/ and fill it from the company's brand code.
   Rename the key below to the folder name. Every template uses only these values, so one filled kit restyles all templates.
   - colors: bg / bg2 (page and its second tone), ink (text), muted (secondary text), accent / accent2 (the two brand colours),
             surface (cards and tiles), line (rules and borders), onAccent (text on an accent-coloured area)
   - fonts: display (titles), body (text), mono (labels). Names from studio/fonts.mjs (add a font there, then run it). Cyrillic: Inter
   - displayWeight / displayCase ('none' | 'uppercase') / displayTracking: how titles are set
   - radius: corner radius in px (0 = sharp, 30 = soft, 999 = pill); grain: film grain 0 to 0.15
   - logo.mark: inline SVG using currentColor (or '' for a wordmark only); logo.text: the wordmark
   - defaults: template, motion and text intro used when the post does not choose one
   Check a kit on every template: node studio/gallery.mjs <product> <brand> */
BRANDS['_blank'] = {
  name: 'Company name', tagline: 'Tagline', url: 'example.com',
  cta: { en: 'Learn more', pl: 'Dowiedz się więcej', ru: 'Узнать больше' },
  mode: 'light',
  colors: { bg: '#F5F5F3', bg2: '#E8E8E4', ink: '#111111', muted: '#6B6B6B', accent: '#1F5BFF', accent2: '#FF7A1F', surface: '#FFFFFF', line: 'rgba(0,0,0,.14)', onAccent: '#FFFFFF' },
  fonts: { display: 'Inter', body: 'Inter', mono: 'JetBrains Mono' },
  displayWeight: 700, displayCase: 'none', displayTracking: '-0.02em', radius: 24, grain: 0.05,
  logo: { text: 'Company', mark: '' },
  defaults: { tpl: 'bento', motion: 'float', tm: 'rise' },
};
