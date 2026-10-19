# DG Trainings website

Static site built with [Astro](https://astro.build). Output is plain HTML/CSS/JS in `dist/` — upload it to the BrillBrains sub-domain.

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

## Live site: https://dgtrainings.brillbrainsconsultants.com

Hosted on the BrillBrains VPS (187.127.176.187, CloudPanel), as the static site
`dgtrainings.brillbrainsconsultants.com` (site user `dgtrainings`).

**How a change goes live:** push to `main` → GitHub Actions builds the site and publishes it to the `vps-dist` branch →
the VPS checks that branch every minute (`deploy/vps-sync.sh`, in the `dgtrainings` user's crontab)
and copies any new build into `/home/dgtrainings/htdocs/dgtrainings.brillbrainsconsultants.com`.
Typically live within 1–2 minutes of the push. Log: `/home/dgtrainings/logs/deploy.log`.

- DNS: Cloudflare, `A dgtrainings → 187.127.176.187`, DNS only (grey cloud).
- HTTPS: Let's Encrypt via CloudPanel (auto-renews).
- The site user's CloudPanel/SFTP password is in `/root/dgtrainings-siteuser.txt` on the server.
- If `deploy/vps-sync.sh` changes, copy it to `/home/dgtrainings/deploy/` on the server.

The old GitHub Pages address (brillbrainstechteam.github.io/dgtrainings/…) now only holds redirect pages
(`deploy/make-redirects.mjs`) that forward each page to the same page on the sub-domain.
