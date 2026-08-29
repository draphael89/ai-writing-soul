// Static site builder: renders content/entries/*.md into dist/.
// Usage: npm run build
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { marked } from 'marked';

const SITE = {
  title: 'AI, Writing, Soul',
  url: 'https://ai-writing-soul.vercel.app',
  eyebrow: 'An experiment in layers',
  dek: 'The same thought, passed through successive layers — voice note, machine transcript, typo-only cleanup, human essay, Claude essay — so the change in form is visible, not just asserted.',
  description: 'An experiment in layers: what happens to the soul of writing when words pass through a machine.',
};

const ROOT = new URL('.', import.meta.url).pathname;
const OUT = join(ROOT, 'dist');
const ENTRIES_DIR = join(ROOT, 'content', 'entries');

const escapeHtml = s => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

const longDate = iso => new Date(`${iso}T12:00:00Z`)
  .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function parseEntry(file) {
  const raw = readFileSync(join(ENTRIES_DIR, file), 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing front matter (--- key: value --- block)`);
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) throw new Error(`${file}: bad front matter line: ${line}`);
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  for (const key of ['title', 'date', 'summary']) {
    if (!meta[key]) throw new Error(`${file}: front matter is missing "${key}"`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${file}: date must be YYYY-MM-DD`);
  const slug = basename(file, '.md').replace(/^(\d{4}-\d{2}-\d{2}-|\d+-)/, '');
  const body = meta.format === 'html' ? match[2] : marked.parse(match[2]);
  return { ...meta, slug, body, file };
}

const page = ({ title, description, path, ogType, content }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${SITE.url}${path}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${SITE.url}${path}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#f7f4ee"/><circle cx="16" cy="16" r="9" fill="none" stroke="#1d1c19" stroke-width="3"/></svg>')}">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<main id="main">
${content}
</main>
<script src="/player.js" defer></script>
</body>
</html>
`;

const entryPage = (entry, number) => page({
  title: `${entry.title} · ${SITE.title}`,
  description: entry.summary,
  path: `/${entry.slug}/`,
  ogType: 'article',
  content: `<nav aria-label="Home"><p class="eyebrow site-nav"><a href="/">${escapeHtml(SITE.title)}</a></p></nav>
<article>
  <header class="masthead entry-header">
    <p class="eyebrow">${escapeHtml(entry.eyebrow || `Entry ${number}`)}</p>
    <h1>${escapeHtml(entry.title)}</h1>
    <p class="dek">${escapeHtml(entry.summary)}</p>
  </header>
  <div class="entry-body">
${entry.body}
  </div>
</article>
<footer>
  <p>${entry.footnote ? `${escapeHtml(entry.footnote)} · ` : ''}Entry ${number} of <a href="/">${escapeHtml(SITE.title)}</a></p>
</footer>`,
});

const indexPage = entries => page({
  title: SITE.title,
  description: SITE.description,
  path: '/',
  ogType: 'website',
  content: `<header class="masthead">
  <p class="eyebrow">${escapeHtml(SITE.eyebrow)}</p>
  <h1>${escapeHtml(SITE.title)}</h1>
  <p class="dek">${escapeHtml(SITE.dek)}</p>
</header>
<h2 class="visually-hidden">Entries</h2>
<ul class="entry-list">
${entries.map(({ entry, number }) => `  <li>
    <p class="entry-meta"><span>Entry ${number}</span> <time datetime="${entry.date}">${longDate(entry.date)}</time></p>
    <h2><a href="/${entry.slug}/">${escapeHtml(entry.title)}</a></h2>
    <p class="entry-summary">${escapeHtml(entry.summary)}</p>
  </li>`).join('\n')}
</ul>
<footer>
  <p>${escapeHtml(SITE.title)} · ${new Date().getUTCFullYear()}</p>
</footer>`,
});

const notFoundPage = () => page({
  title: `Not found · ${SITE.title}`,
  description: SITE.description,
  path: '/404',
  ogType: 'website',
  content: `<header class="masthead">
  <p class="eyebrow">404</p>
  <h1>Not found</h1>
  <p class="dek">This page doesn&#x27;t exist. <a href="/">Back to the entries.</a></p>
</header>`,
});

// Build
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const files = readdirSync(ENTRIES_DIR).filter(f => f.endsWith('.md')).sort();
const parsed = files.map(parseEntry).filter(e => e.draft !== 'true');
parsed.sort((a, b) => a.date.localeCompare(b.date) || a.file.localeCompare(b.file));
const slugs = new Set();
for (const e of parsed) {
  if (slugs.has(e.slug)) throw new Error(`duplicate slug: ${e.slug}`);
  slugs.add(e.slug);
}
const numbered = parsed.map((entry, i) => ({ entry, number: String(i + 1).padStart(2, '0') }));

for (const { entry, number } of numbered) {
  mkdirSync(join(OUT, entry.slug), { recursive: true });
  writeFileSync(join(OUT, entry.slug, 'index.html'), entryPage(entry, number));
}
writeFileSync(join(OUT, 'index.html'), indexPage(numbered.slice().reverse()));
writeFileSync(join(OUT, '404.html'), notFoundPage());
cpSync(join(ROOT, 'public'), OUT, { recursive: true });
cpSync(join(ROOT, 'site', 'styles.css'), join(OUT, 'styles.css'));
cpSync(join(ROOT, 'site', 'player.js'), join(OUT, 'player.js'));

console.log(`Built ${numbered.length} ${numbered.length === 1 ? 'entry' : 'entries'} → dist/`);
for (const { entry, number } of numbered) console.log(`  ${number}  /${entry.slug}/  (${entry.file})`);
