// @ts-check
import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Deploy targets:
//  - GitHub Pages project site: SITE_URL=https://brillbrainstechteam.github.io BASE_PATH=/dgtrainings
//  - Final BrillBrains sub-domain: leave BASE_PATH unset (served from the domain root)
const SITE = process.env.SITE_URL || 'https://dgtrainings.brillbrainsconsultants.com';
const BASE = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');

/** Pages link to root paths like "/programs/". When the site lives under a sub-path, prefix them after the build. */
function basePathLinks() {
  return {
    name: 'base-path-links',
    hooks: {
      'astro:build:done': ({ dir }) => {
        if (BASE === '/') return;
        const prefix = BASE.replace(/\/$/, '');
        const attr = new RegExp(`\\b(href|src|poster|data-full|action)="/(?!/)(?!${prefix.slice(1)}/)`, 'g');
        const walk = (d) => readdirSync(d).forEach((f) => {
          const p = join(d, f);
          if (statSync(p).isDirectory()) return walk(p);
          if (!p.endsWith('.html')) return;
          writeFileSync(p, readFileSync(p, 'utf8').replace(attr, `$1="${prefix}/`));
        });
        walk(fileURLToPath(dir));
      },
    },
  };
}

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  integrations: [basePathLinks()],
});
