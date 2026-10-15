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
Every push to `main` builds the site and publishes it to GitHub Pages via `.github/workflows/deploy.yml`:
https://brillbrainstechteam.github.io/dgtrainings/

One-time setup: in the GitHub repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

Moving to the BrillBrains sub-domain later: in the workflow set `SITE_URL` to the sub-domain and delete `BASE_PATH`,
then add the domain under Settings → Pages → Custom domain.

To build locally for the GitHub Pages path (Git Bash on Windows needs `MSYS_NO_PATHCONV=1`):
`SITE_URL=https://brillbrainstechteam.github.io BASE_PATH=/dgtrainings npm run build`
