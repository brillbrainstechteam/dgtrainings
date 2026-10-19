# DG Trainings website

Static site built with [Astro](https://astro.build). Output is plain HTML/CSS/JS in `dist/` — served at https://dgtrainings.com (see Live site below).

```bash
npm install
npm run dev      # local preview at http://localhost:4321
npm run build    # production files in dist/
```

## Editing content
All copy lives in `src/data/content.json` (home page, trainer, 10 programs, client engagements).
Text in `[square brackets]` shows on the site as a yellow "to confirm" highlight — replace it with the real detail.

## Adding client photos
Every Google Drive client folder (Antraa 2026, Chetmani, DC 1 … VChains) is already listed in `media-map.json`.
1. Download the folder from Drive and unzip it into `../Media/` keeping the Drive folder name (e.g. `Media/Shivam Jewels/`). Sub-folders are fine.
2. Run `npm run media` — up to 12 photos per client are resized into `src/assets/work/<key>/`. Folders not uploaded yet are skipped.
3. Rebuild. That client's card in the Client Snapshot becomes clickable, and it gets its own gallery page under Our Work automatically.
4. Optional: add a curated entry to `WORK` in `content.json` (program, date, city, blurb, `program_slug`) to replace the "[confirm]" placeholders and feature it on a program page.

## Motion
Animations use GSAP (ScrollTrigger + SplitText) in `src/scripts/motion.ts` and respect the visitor's "reduce motion" setting.
Add `?static` to any URL to view the page without animation.

## Deployment
Every push to `main` builds the site and publishes it to the `gh-pages` branch via `.github/workflows/deploy.yml`, which GitHub Pages serves:
https://brillbrainstechteam.github.io/dgtrainings/

Pages settings: **Settings → Pages → Source: Deploy from a branch → `gh-pages` / root**. Keep the repository public (GitHub Free cannot serve Pages from a private repo).

Moving to the BrillBrains sub-domain later: in the workflow set `SITE_URL` to the sub-domain and delete `BASE_PATH`,
then add the domain under Settings → Pages → Custom domain.

To build locally for the GitHub Pages path (Git Bash on Windows needs `MSYS_NO_PATHCONV=1`):
`SITE_URL=https://brillbrainstechteam.github.io BASE_PATH=/dgtrainings npm run build`

## Live site: https://dgtrainings.com

Hosted on the BrillBrains VPS (187.127.176.187, CloudPanel), as the static site
`dgtrainings.com` (site user `dgtrainingscom`). `www.dgtrainings.com` redirects to `dgtrainings.com`.

**How a change goes live:** push to `main` → GitHub Actions builds the site and publishes it to the `vps-dist` branch →
the VPS checks that branch every minute (`deploy/vps-sync.sh`, in the `dgtrainingscom` user's crontab)
and copies any new build into `/home/dgtrainingscom/htdocs/dgtrainings.com`.
Typically live within 1–2 minutes of the push. Log: `/home/dgtrainingscom/logs/deploy.log`.

- Domain registered at GoDaddy, nameservers on Cloudflare. DNS: `A dgtrainings.com → 187.127.176.187` and
  `CNAME www → dgtrainings.com`.
- HTTPS: Let's Encrypt via CloudPanel for `dgtrainings.com` + `www.dgtrainings.com` (auto-renews).
- The site user's CloudPanel/SFTP password is in `/root/dgtrainingscom-siteuser.txt` on the server.
- If `deploy/vps-sync.sh` changes, copy it to `/home/dgtrainingscom/deploy/` on the server.

Old addresses that now redirect to the same page on dgtrainings.com:
- `dgtrainings.brillbrainsconsultants.com` — 301 redirect in its CloudPanel vhost (site user `dgtrainings`, kept only for this
  redirect and its certificate).
- `brillbrainstechteam.github.io/dgtrainings/…` — redirect pages on `gh-pages` (`deploy/make-redirects.mjs`).
