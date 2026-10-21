// Behaviour events for the Umami dashboard (https://analytics.dgtrainings.com → Events).
// Page views are counted by the tracker in Base.astro; this adds the clicks that matter for leads.
// One listener on the document, so it keeps working across page transitions.

type Data = Record<string, string | number>;
declare global { interface Window { umami?: { track: (event: string, data?: Data) => void } } }

/** Send an event to Umami (no-op when the tracker is blocked or on localhost). */
export const track = (event: string, data?: Data) => { try { window.umami?.track(event, data); } catch {} };

/** Where on the page a click happened, e.g. "header", "footer", "hero", "cta". */
function area(el: Element): string {
  if (el.closest('.topbar')) return 'top bar';
  if (el.closest('.header')) return 'header';
  if (el.closest('footer')) return 'footer';
  if (el.closest('.wa-float, [class*="float"]')) return 'floating button';
  if (el.closest('.phero, .hero, .lhero')) return 'hero';
  if (el.closest('.cta')) return 'cta band';
  return el.closest('section[id]')?.id || 'page';
}

const label = (el: Element) => (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 60);

if (!(window as any).__dgAnalytics) {
  (window as any).__dgAnalytics = true;
  document.addEventListener('click', (e) => {
    const el = (e.target as Element).closest('a, button');
    if (!el) return;
    const page = location.pathname;
    const href = el.getAttribute('href') || '';

    if (el.matches('button[data-view]')) return track('brochure-open', { brochure: (el as HTMLElement).dataset.title || '', page });
    if (!href) return;
    if (/wa\.me|whatsapp/i.test(href)) return track('whatsapp-click', { area: area(el), page });
    if (href.startsWith('tel:')) return track('call-click', { number: href.slice(4), area: area(el), page });
    if (href.startsWith('mailto:')) return track('email-click', { area: area(el), page });
    if (/instagram|facebook|youtube/i.test(href)) return track('social-click', { network: href.match(/instagram|facebook|youtube/i)![0].toLowerCase(), page });
    if (href.startsWith('/contact')) return track('book-training-click', { button: label(el), area: area(el), page });
    if (/\.pdf($|\?)/i.test(href)) return track('download', { file: href.split('/').pop() || href, page });
    if (/^https?:/i.test(href) && !href.includes(location.hostname)) return track('outbound-click', { url: href.replace(/^https?:\/\//, '').slice(0, 80), page });
  }, { capture: true });
}
