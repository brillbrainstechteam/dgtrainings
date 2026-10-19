# Moving to dgtrainings.com, and SEO

What was done on 19 Oct 2026 to move the site from `dgtrainings.brillbrainsconsultants.com` to `dgtrainings.com`,
why each step was needed, and what is still left to do for Google.

## 1. How a request reaches the site

```
Visitor types dgtrainings.com
  → GoDaddy (registrar) says: "ask Cloudflare" (nameservers felicity/katja.ns.cloudflare.com)
  → Cloudflare DNS answers: A dgtrainings.com → 187.127.176.187 (the VPS)
  → nginx on the VPS picks the "server block" whose server_name matches the host name
  → nginx serves files from that site's folder, over HTTPS with that site's certificate
```

Updating the IP in Cloudflare only covers the first three lines. Until the VPS had a matching
`server_name` and a certificate for `dgtrainings.com`, nginx had no site for that name and browsers
would have shown a certificate error.

## 2. What was changed on the VPS (CloudPanel, 187.127.176.187)

### a) A new CloudPanel site for dgtrainings.com
```bash
clpctl site:add:static --domainName=dgtrainings.com --siteUser=dgtrainingscom --siteUserPassword='…'
```
- Creates the Linux user `dgtrainingscom`, the folder `/home/dgtrainingscom/htdocs/dgtrainings.com`
  and the nginx file `/etc/nginx/sites-enabled/dgtrainings.com.conf`.
- That file has two server blocks: `www.dgtrainings.com` → 301 redirect to `https://dgtrainings.com`,
  and `dgtrainings.com`, which serves the files.
- Why a new site and not a rename: CloudPanel can't rename a site's domain. A new site keeps CloudPanel's
  UI, backups and certificate renewal working normally.
- The site user's password is in `/root/dgtrainingscom-siteuser.txt` (root-only).

### b) HTTPS certificate (Let's Encrypt)
```bash
clpctl lets-encrypt:install:certificate --domainName=dgtrainings.com --subjectAlternativeName=www.dgtrainings.com
```
- Let's Encrypt checks that you control the domain by fetching a file from
  `http://dgtrainings.com/.well-known/acme-challenge/…`. That only works because DNS already points at the VPS.
- One certificate covers both names. It is valid for 90 days and CloudPanel renews it automatically.
- To check it: `openssl x509 -in /etc/nginx/ssl-certificates/dgtrainings.com.crt -noout -enddate -ext subjectAltName`

### c) Auto-deploy moved to the new site
- `deploy/vps-sync.sh` now copies builds into `/home/dgtrainingscom/htdocs/dgtrainings.com`.
  It is installed at `/home/dgtrainingscom/deploy/vps-sync.sh`.
- The crontab moved from the old user to the new one (`crontab -u dgtrainingscom -l`):
  `* * * * * /home/dgtrainingscom/deploy/vps-sync.sh`. The old user's crontab was removed.
- Deploy log: `/home/dgtrainingscom/logs/deploy.log`.

### d) The old subdomain now 301-redirects
The vhost of `dgtrainings.brillbrainsconsultants.com` was replaced with:
```nginx
location ~ /.well-known { allow all; }                       # its certificate keeps renewing
location / { return 301 https://dgtrainings.com$request_uri; } # same page on the new domain
```
- A **301 (permanent)** redirect tells Google the page has moved for good, so it passes ranking signals to the
  new URL and replaces the old address in search results. Every path maps across, so
  `/programs/marketing-training/` goes to the same page on the new domain.
- CloudPanel keeps a site's vhost in its database (`/home/clp/htdocs/app/data/db.sq3`, table `site`,
  column `vhost_template`) and regenerates the nginx file from it. Both were updated, so a
  CloudPanel action won't undo the change. Backups: `/root/db.sq3.bak-dgtrainings-*` and
  `/root/dgtrainings.brillbrainsconsultants.com.conf.bak`.
- **Don't delete the old site** in CloudPanel. It now exists only to redirect old links and Google results.

### e) Custom 404 page
`error_page 404 /404.html;` was added to the dgtrainings.com vhost (database + file, backup
`/root/dgtrainings.com.conf.bak`). Unknown URLs now show the site's own "page moved" page with a real
404 status, so Google drops dead URLs rather than indexing an error page.

### Checking it yourself
```bash
curl -I https://dgtrainings.com/                                         # 200
curl -I https://www.dgtrainings.com/                                     # 301 → https://dgtrainings.com/
curl -I http://dgtrainings.com/                                          # 301 → https://
curl -I https://dgtrainings.brillbrainsconsultants.com/contact/          # 301 → https://dgtrainings.com/contact/
nginx -t && systemctl reload nginx                                       # after any vhost edit
```

## 3. SEO work done in the code

| What | Where | Why |
|---|---|---|
| Site URL is `https://dgtrainings.com` | `astro.config.mjs`, workflow | Every canonical tag, sitemap entry and share link uses the new domain |
| `sitemap-index.xml` (16 pages) | `@astrojs/sitemap` in `astro.config.mjs` | Lists every page for Google to crawl |
| `robots.txt` | `public/robots.txt` | Allows crawling and points to the sitemap |
| Shorter keyword-led titles (≤ ~65 chars) | each page's `<Base title>` | e.g. "Marketing Training for Jewellers"; Google cuts long titles |
| Descriptions trimmed to ~155 chars | `Base.astro` | Avoids a cut-off snippet in results |
| Open Graph + Twitter tags with a 1200×630 photo | `Base.astro` (`image` prop) | Clean previews when links are shared on WhatsApp, LinkedIn, Facebook |
| Organization + WebSite structured data | `Base.astro` | Tells Google the name, logo, phone, email, Mumbai location and social profiles |
| BreadcrumbList | `crumbs` prop on inner pages | Breadcrumb trail in results instead of a raw URL |
| Course (+ FAQPage) on each program page | `programs/[slug].astro` | Each program is described as a course offered by DG Trainings |
| FAQPage on Contact, Person on About, ItemList on Programs | those pages | Clearer meaning for Google and AI answers |
| PNG logo `public/logo.png` | | Google needs a raster logo for the brand panel |
| Custom `404.astro` (noindex) | | Proper "not found" behaviour |

To test the structured data: paste a page URL into https://search.google.com/test/rich-results

## 4. Still to do (needs your Google / business accounts)

1. **Google Search Console** (https://search.google.com/search-console):
   - Add a **Domain** property for `dgtrainings.com`. Search Console can add its verification record to Cloudflare
     for you, or you can add the TXT record it shows in Cloudflare DNS by hand.
   - Sitemaps → submit `https://dgtrainings.com/sitemap-index.xml`.
   - URL Inspection → request indexing for the home page and the program pages.
   - If the old subdomain was verified in Search Console, keep that property. Try **Settings → Change of address**
     to point it at dgtrainings.com. Search Console may not offer this for a subdomain; the 301 redirects do the
     job either way.
2. **Bing Webmaster Tools**: import the site from Search Console (one click). This also covers Yahoo and DuckDuckGo.
3. **Google Business Profile** for "DG Trainings" (Mumbai, category e.g. "Business training service" or
   "Corporate trainer"), with website `https://dgtrainings.com`. Ask happy clients for Google reviews.
   This matters most for local searches ("jewellery staff training Mumbai").
4. **Update every link to the site** to `https://dgtrainings.com`: Instagram/Facebook/YouTube bios, the BrillBrains
   website, LinkedIn, WhatsApp Business profile, email signatures, brochures/PDFs. Links from other sites
   (backlinks) are a major ranking factor. Links from client jewellers' websites and trade associations help most.
5. **Fill the "[to confirm]" placeholders** still showing on Management, Business & Technical, Digital Shakti
   and Orientation program pages. Unfinished text hurts trust and rankings.
6. **Keep adding real content**: case studies per client (with photos and results), testimonials with names,
   and short articles answering what jewellers search for (e.g. "how to train jewellery showroom staff").
   Fresh, specific content is what moves rankings over time.
7. Optional: Google Analytics 4 or Cloudflare Web Analytics, to see which pages bring enquiries.

Expect Google to show dgtrainings.com within days of submitting the sitemap. Rankings build up over weeks to months.
