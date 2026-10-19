// Builds a redirect-only copy of the site for GitHub Pages: every page of the real build
// (dist-vps) gets a tiny HTML file that forwards to the same page on the sub-domain.
// GitHub Pages can't send server redirects, so this uses an instant JS redirect, a meta refresh
// fallback and a canonical link (which tells search engines the sub-domain is the real address).
// Usage: node deploy/make-redirects.mjs <built-site-dir> <out-dir> <new-origin> <old-base>
import { readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';

const [src = 'dist-vps', out = 'dist-redirects', origin = 'https://dgtrainings.brillbrainsconsultants.com', base = '/dgtrainings'] = process.argv.slice(2);

const page = (target) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>DG Trainings has moved</title>
<link rel="canonical" href="${target}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(target)} + location.search + location.hash)</script>
</head><body style="font-family:sans-serif;padding:40px">
<p>DG Trainings has moved to <a href="${target}">${target}</a>.</p>
</body></html>
`;

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});

let n = 0;
for (const file of walk(src)) {
  const rel = relative(src, file).split(sep).join('/');
  const path = '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '/');
  const dest = join(out, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, page(origin + path));
  n++;
}
// Any other old address (files, unknown paths): forward with the path kept, minus the old base.
const fallback = `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>DG Trainings has moved</title>
<script>var p=location.pathname.replace(${JSON.stringify(base)},'')||'/';location.replace(${JSON.stringify(origin)}+p+location.search+location.hash)</script>
</head><body><p>DG Trainings has moved to <a href="${origin}/">${origin}</a>.</p></body></html>
`;
writeFileSync(join(out, '404.html'), fallback);
writeFileSync(join(out, '.nojekyll'), '');
console.log(`${n} redirect pages written to ${out}`);
