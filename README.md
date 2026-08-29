# AI, Writing, Soul

A quiet, serif, text-first site of entries about AI, writing, and the soul of form.
Live at **https://ai-writing-soul.vercel.app/**.

No framework, no CMS: a ~150-line Node script (`build.mjs`) renders Markdown files
from `content/entries/` into static HTML in `dist/`, which Vercel serves. The only
dependency is [`marked`](https://github.com/markedjs/marked) (Markdown → HTML).

## Adding a new entry

**One line:** create `content/entries/YYYY-MM-DD-your-slug.md` with a front-matter
block and a Markdown body, then push to `main` — Vercel rebuilds and deploys.

```markdown
---
title: The Next Entry
date: 2026-09-15
summary: One or two sentences shown on the home page and as the entry's dek.
---

The body, in ordinary Markdown. Headings (`##`), blockquotes, lists, and raw
HTML all work and inherit the site's styling.
```

That's it. The build discovers the file, gives the entry a page at
`/your-slug/` (the filename minus `.md` and minus any leading date/number
prefix), numbers it chronologically, and lists it on the home page (newest
first).

### Optional front-matter keys

| Key        | Purpose                                                                 |
|------------|-------------------------------------------------------------------------|
| `eyebrow`  | Small caps line above the title (defaults to "Entry NN")                |
| `footnote` | Extra text in the entry's footer (e.g. "Draft structure · August 2026") |
| `format`   | `html` = body is used verbatim, skipping the Markdown pass (used by the layered first entry so its section markup is preserved byte-for-byte) |
| `draft`    | `true` = excluded from the build                                        |

### Audio players

Drop the audio file in `public/`, then include this block anywhere in the body
(`data-duration` is the length in seconds, used before metadata loads):

```html
<div class="audio-block">
  <span class="audio-label" id="my-audio-label">Layer 01 · Original voice note · 9:37</span>
  <div class="custom-player" data-duration="577" aria-labelledby="my-audio-label">
    <audio src="/my-audio.mp3" preload="metadata"></audio>
    <button class="play-button" type="button" aria-label="Play original voice note">▶</button>
    <button class="progress" type="button" aria-label="Seek within voice note"><span class="progress-fill"></span></button>
    <span class="time">0:00 / 9:37</span>
  </div>
</div>
```

`site/player.js` wires up every `.custom-player` on a page automatically
(play/pause, click- and arrow-key seeking).

## Repository layout

```
content/entries/*.md   ← the entries (one file each; this is all you touch)
public/                ← static assets, copied verbatim to the site root
                         (audio, pangram-report.pdf, report preview image)
site/styles.css        ← the one stylesheet (design tokens at the top)
site/player.js         ← the audio player
build.mjs              ← the whole build; site title/dek in the SITE constant
vercel.json            ← tells Vercel: run `npm run build`, serve `dist/`
```

## Developing locally

```sh
npm install
npm run build   # writes dist/
npm run dev     # build + serve dist/ on localhost
```

## Deploying

Push to `main`. The Vercel project connected to this repo runs `npm run build`
(per `vercel.json`) and serves `dist/` at the production URL. Nothing else to do.
