// Site-wide interactions + GSAP motion. Runs on every page load (Astro view transitions aware).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

// '?static' in the URL disables motion (useful for QA screenshots)
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches || location.search.includes('static');
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const EASE = 'expo.out';

let ctx: gsap.Context | null = null;
let splits: SplitText[] = [];
const cleanups: (() => void)[] = [];

function setMotionClass() {
  document.documentElement.classList.toggle('motion', !reduce());
}
setMotionClass();
document.addEventListener('astro:after-swap', setMotionClass);

/* ---------------- non-motion UI ---------------- */
function header() {
  const h = document.querySelector<HTMLElement>('.header');
  if (!h) return;
  const solidAlways = document.body.dataset.header === 'solid';
  let solid: boolean | null = null;
  const on = () => { const v = solidAlways || scrollY > 40; if (v !== solid) { solid = v; h.classList.toggle('is-solid', v); } };
  on();
  addEventListener('scroll', on, { passive: true });
  cleanups.push(() => removeEventListener('scroll', on));

  const t = h.querySelector<HTMLButtonElement>('.nav-toggle');
  const n = h.querySelector<HTMLElement>('#nav');
  const close = () => { n?.classList.remove('open'); t?.setAttribute('aria-expanded', 'false'); t?.setAttribute('aria-label', 'Open menu'); document.body.style.overflow = ''; };
  t?.addEventListener('click', () => {
    const open = !n!.classList.contains('open');
    n!.classList.toggle('open', open);
    t.setAttribute('aria-expanded', String(open));
    t.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && !reduce()) gsap.from($('#nav > a, #nav .dd > a, #nav .dd-menu a'), { y: 24, opacity: 0, duration: .6, stagger: .03, ease: EASE });
  });
  n?.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  const esc = (e: KeyboardEvent) => e.key === 'Escape' && close();
  addEventListener('keydown', esc);
  cleanups.push(() => { removeEventListener('keydown', esc); document.body.style.overflow = ''; });
}

/** Smoothly animated <details> (FAQ + curriculum). */
function accordions() {
  $<HTMLDetailsElement>('details.acc, details.mod').forEach((d) => {
    const s = d.querySelector('summary')!;
    const body = d.querySelector<HTMLElement>('.acc-body')!;
    s.addEventListener('click', (e) => {
      if (reduce()) return;
      e.preventDefault();
      if (d.open) {
        gsap.to(body, { height: 0, duration: .45, ease: 'power3.inOut', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'height' }); } });
      } else {
        d.open = true;
        gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: .6, ease: EASE, onComplete: () => { gsap.set(body, { clearProps: 'height' }); ScrollTrigger.refresh(); } });
        gsap.from(body.querySelectorAll('li, p'), { y: 10, opacity: 0, duration: .5, stagger: .02, ease: EASE, delay: .05 });
      }
    });
  });
  const btn = document.querySelector<HTMLButtonElement>('.toggle-all');
  btn?.addEventListener('click', () => {
    const open = btn.dataset.open !== 'true';
    $<HTMLDetailsElement>('.modules details').forEach((d) => (d.open = open));
    btn.dataset.open = String(open);
    btn.textContent = open ? 'Collapse all modules' : 'Expand all modules';
    ScrollTrigger.refresh();
  });
}

/** Lightbox for any [data-gallery] group of buttons with data-full. */
function lightbox() {
  const dlg = document.querySelector<HTMLDialogElement>('#lightbox');
  if (!dlg) return;
  const img = dlg.querySelector('img')!;
  const count = dlg.querySelector('.lb-count')!;
  let list: HTMLButtonElement[] = [];
  let i = 0;
  const show = (n: number) => {
    i = (n + list.length) % list.length;
    img.src = list[i].dataset.full!;
    img.alt = list[i].querySelector('img')?.alt ?? '';
    count.textContent = `${i + 1} / ${list.length}`;
    if (!reduce()) gsap.fromTo(img, { opacity: 0, scale: .97 }, { opacity: 1, scale: 1, duration: .5, ease: EASE });
  };
  $<HTMLButtonElement>('[data-gallery] button[data-full]').forEach((b) => b.addEventListener('click', () => {
    list = $<HTMLButtonElement>('button[data-full]', b.closest('[data-gallery]')!);
    dlg.showModal(); show(list.indexOf(b));
  }));
  dlg.querySelector('.lb-close')!.addEventListener('click', () => dlg.close());
  dlg.querySelector('.lb-prev')!.addEventListener('click', () => show(i - 1));
  dlg.querySelector('.lb-next')!.addEventListener('click', () => show(i + 1));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); });
}

function subnav() {
  const links = $<HTMLAnchorElement>('.subnav a');
  links.forEach((l) => {
    const sec = document.querySelector(l.hash);
    if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: (s) => s.isActive && links.forEach((x) => x.classList.toggle('on', x === l)) });
  });
}

function contactForm() {
  const f = document.querySelector<HTMLFormElement>('#plan');
  if (!f) return;
  const boxes = $<HTMLInputElement>('input[name="program"]', f);
  const q = new URLSearchParams(location.search).get('program');
  if (q) boxes.forEach((b) => (b.checked = b.value === q));
  let via = 'wa';
  $<HTMLButtonElement>('button[data-via]', f).forEach((b) => b.addEventListener('click', () => (via = b.dataset.via!)));
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(f);
    if (d.get('_honey')) return;
    let ok = true;
    ['name', 'phone'].forEach((k) => {
      const el = f.elements.namedItem(k) as HTMLInputElement;
      const bad = !String(d.get(k) || '').trim();
      el.setAttribute('aria-invalid', String(bad));
      if (bad) ok = false;
    });
    (f.querySelector('.err') as HTMLElement).hidden = ok;
    if (!ok) { f.querySelector<HTMLElement>('[aria-invalid="true"]')!.focus(); return; }
    const picked = boxes.filter((b) => b.checked).map((b) => b.dataset.name!);
    const progs = picked.length ? picked.join(', ') : 'Not sure — please recommend';
    const v = (k: string) => String(d.get(k) || '').trim() || '-';
    const lead = { name: v('name'), business: v('business'), phone: v('phone'), email: v('email'), programs: progs, goals: v('goals') };

    // Optional: log every enquiry as a row in a Google Sheet (see docs/enquiries-to-google-sheets.md)
    if (f.dataset.sheet) {
      fetch(f.dataset.sheet, { method: 'POST', mode: 'no-cors', keepalive: true,
        body: new URLSearchParams({ ...lead, via: via === 'mail' ? 'Email' : 'WhatsApp', page: location.href }) }).catch(() => {});
    }

    if (via !== 'mail') {
      const msg = `*New training enquiry*\nName: ${lead.name}\nBusiness: ${lead.business}\nPhone: ${lead.phone}\nEmail: ${lead.email}\nTrainings: ${lead.programs}\nTeam size & goals: ${lead.goals}`;
      window.open(`https://wa.me/${f.dataset.wa}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      return;
    }
    // Email: posted straight to the training inbox through FormSubmit (no mail app needed)
    const btn = f.querySelector<HTMLButtonElement>('button[data-via="mail"]')!;
    const status = f.querySelector<HTMLElement>('.sent')!;
    btn.disabled = true; btn.dataset.label ??= btn.innerHTML; btn.textContent = 'Sending…';
    fetch(`https://formsubmit.co/ajax/${f.dataset.email}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `New training enquiry — ${lead.name}${lead.business !== '-' ? ' (' + lead.business + ')' : ''}`,
        _template: 'table', _captcha: 'false',
        ...(lead.email !== '-' ? { _replyto: lead.email } : {}),
        Name: lead.name, Business: lead.business, 'Phone / WhatsApp': lead.phone, Email: lead.email,
        Trainings: lead.programs, 'Team size & goals': lead.goals, Page: location.href,
      }),
    })
      .then((r) => r.json().then((j) => r.ok && String(j.success) === 'true'))
      .then((sent) => {
        if (!sent) throw new Error('not sent');
        status.hidden = false; status.className = 'sent ok';
        status.textContent = 'Thank you — your enquiry has reached our training team. We’ll call you shortly.';
        f.reset();
      })
      .catch(() => {
        status.hidden = false; status.className = 'sent bad';
        status.innerHTML = `Sorry, that didn’t go through. Please <a href="mailto:${f.dataset.email}">email us</a> or use WhatsApp.`;
      })
      .finally(() => { btn.disabled = false; btn.innerHTML = btn.dataset.label!; });
  });
}

/* ---------------- motion ---------------- */
function countUp(el: HTMLElement) {
  const raw = el.textContent!.trim();
  const m = raw.match(/^([\d,]+)(.*)$/);
  if (!m) return;
  const end = +m[1].replace(/,/g, '');
  const o = { v: 0 };
  el.textContent = '0' + m[2];
  gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', delay: .4, scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-IN') + m[2]; } });
}

function motion() {
  // Headline line reveals
  // hold the hero entrance until the opening logo animation has lifted
  const introDelay = document.documentElement.classList.contains('intro') ? 2.2 : 0;
  $('[data-split]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
    splits.push(split);
    const hero = el.closest('.hero, .phero');
    gsap.from(split.lines, { yPercent: 110, duration: 1.2, stagger: .1, ease: EASE, delay: hero ? .25 + introDelay : 0,
      scrollTrigger: hero ? undefined : { trigger: el, start: 'top 88%', once: true } });
  });

  // Hero entrance sequence
  const hero = $('[data-hero]');
  if (hero.length) gsap.fromTo(hero, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: .09, ease: EASE, delay: .5 + introDelay });
  $('.hero-media, .phero-bg').forEach((m) => {
    gsap.fromTo(m, { scale: 1.12 }, { scale: 1, duration: 2.4, ease: 'power2.out', delay: introDelay });
    gsap.to(m, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: m.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
  });

  // Generic reveals
  ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', once: true,
    onEnter: (b) => gsap.fromTo(b, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .1, ease: EASE, overwrite: true }) });
  $('[data-stagger]').forEach((g) => gsap.fromTo(g.children, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .08, ease: EASE,
    scrollTrigger: { trigger: g, start: 'top 88%', once: true } }));

  // Image wipe reveals
  $('[data-img]').forEach((el) => {
    const img = el.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0% round 26px)' }, { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 1.4, ease: 'expo.inOut' });
    if (img) tl.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: EASE }, 0);
  });

  // Parallax
  $('[data-parallax]').forEach((el) => gsap.fromTo(el, { yPercent: -(+el.dataset.parallax! || 10) }, { yPercent: +el.dataset.parallax! || 10, ease: 'none',
    scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // Counters
  $('[data-count]').forEach(countUp);

  // Steps progress line
  $('.steps-line i').forEach((l) => gsap.to(l, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: l.closest('.steps'), start: 'top 75%', end: 'bottom 55%', scrub: true } }));

  // Process diagram: benefit chain — track fills, nodes light up in sequence
  $('[data-chain]').forEach((el) => {
    const nodes = $('.cnode', el);
    const vertical = innerWidth <= 960;
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
    tl.fromTo(el.querySelector('.chain-track i'), vertical ? { scaleY: 0 } : { scaleX: 0 }, { scaleX: 1, scaleY: 1, duration: 2.2, ease: 'power2.inOut' }, 0);
    nodes.forEach((n, i) => {
      const at = (i / Math.max(nodes.length - 1, 1)) * 1.9;
      tl.fromTo(n, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: EASE }, at);
      tl.fromTo(n.querySelector('.cbadge'), { scale: .6 }, { scale: 1, duration: .8, ease: 'back.out(2)' }, at);
      tl.call(() => n.classList.add('lit'), [], at + .3);
    });
  });

  // Process diagram: approach cycle — arcs draw around the ring
  $('[data-cycle]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 70%', once: true } });
    tl.from(el.querySelector('.ring-center'), { scale: .7, opacity: 0, duration: .9, ease: 'back.out(1.6)' }, 0);
    $<SVGPathElement>('.ring-arc', el).forEach((a, i) => {
      const len = a.getTotalLength();
      tl.fromTo(a, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: .7, ease: 'power2.inOut', onComplete: () => gsap.set(a, { clearProps: 'strokeDasharray,strokeDashoffset' }) }, .3 + i * .55);
    });
    tl.from($('.ring-node', el), { scale: 0, transformOrigin: '50% 50%', duration: .6, stagger: .55, ease: 'back.out(2.4)' }, .15);
    tl.fromTo($('.cy-step', el), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .55, ease: EASE, clearProps: 'transform' }, .2);
  });

  // Process diagram: program impact path — stages slide in left→right, chevrons pulse
  $('[data-path]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 78%', once: true } });
    tl.fromTo($('.pstage', el), { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: .9, stagger: .25, ease: EASE });
    tl.from($('.parrow i', el), { opacity: 0, x: -10, duration: .4, stagger: .08 }, .4);
  });

  // Hub ("circle with pointers"): centre pops, connector lines draw outwards, items arrive in order
  $('[data-hub]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 72%', once: true } });
    tl.fromTo(el.querySelector('.hub-core'), { scale: .5, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.5)' });
    $<SVGLineElement>('.hub-line', el).forEach((l, i) => {
      tl.fromTo(l, { attr: { x2: 50, y2: 50 } }, { attr: { x2: +l.getAttribute('x2')!, y2: +l.getAttribute('y2')! }, duration: .6, ease: 'power2.out' }, .35 + i * .07);
    });
    tl.fromTo($('.hub-item', el), { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .6, stagger: .07, ease: 'back.out(2)' }, .55);
  });

  // Concentric rings grow from the centre, legend follows
  $('[data-rings]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 72%', once: true } });
    tl.fromTo(el.querySelector('.ring-core'), { scale: 0 }, { scale: 1, duration: .6, ease: 'back.out(2)' });
    tl.fromTo($('.ring', el).reverse(), { scale: .2, opacity: 0 }, { scale: 1, opacity: 1, duration: .8, stagger: .18, ease: EASE }, .2);
    tl.fromTo($('.rings-legend li', el), { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: .7, stagger: .18, ease: EASE }, .3);
  });

  // Timeline: line draws, phases drop in
  $('[data-timeline]').forEach((el) => {
    const vertical = innerWidth <= 900;
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
    tl.fromTo(el.querySelector('.tl-line i'), vertical ? { scaleY: 0 } : { scaleX: 0 }, { scaleX: 1, scaleY: 1, duration: 1.6, ease: 'power2.inOut' });
    tl.fromTo($('.tl-ph', el), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .3, ease: EASE }, .2);
    tl.fromTo($('.tl-dot', el), { scale: 0 }, { scale: 1, duration: .5, stagger: .3, ease: 'back.out(2.5)' }, .3);
  });

  // Funnel: bars slide in from alternate sides and narrow into the result
  $('[data-funnel]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
    $('li', el).forEach((li, i) => tl.fromTo(li, { x: i % 2 ? 60 : -60, opacity: 0 }, { x: 0, opacity: 1, duration: .7, ease: EASE }, i * .15));
    tl.fromTo(el.querySelector('.f-out'), { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'back.out(2)' });
  });

  // Before/after board: each pair slides in from opposite sides, chevrons pop between them
  $('[data-vs]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
    tl.fromTo(el.querySelector('.vs-head'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: EASE });
    tl.fromTo(el.querySelector('.vs-badge'), { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: .7, ease: 'back.out(2.2)' }, .2);
    $('.vs-row:not(.vs-head)', el).forEach((r, i) => {
      const at = .45 + i * .16;
      tl.fromTo(r.querySelector('.vs-bad'), { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: .6, ease: EASE }, at);
      tl.fromTo(r.querySelector('.vs-good'), { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: .6, ease: EASE }, at + .08);
      tl.fromTo(r.querySelectorAll('.vs-mid i'), { scale: 0 }, { scale: 1, duration: .4, stagger: .06, ease: 'back.out(3)' }, at + .15);
    });
  });

  // Route map: the road draws itself, then pins drop onto it
  $('[data-route]').forEach((el) => {
    const road = el.querySelector<SVGPathElement>('.rt-road');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
    if (road) { const len = road.getTotalLength(); tl.fromTo(road, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', onComplete: () => gsap.set(road, { clearProps: 'strokeDasharray,strokeDashoffset' }) }); }
    tl.fromTo($('.rt-stop', el), { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: .6, stagger: .2, ease: 'back.out(2)' }, .5);
  });

  // Milestone track: the bar fills from left to right as milestones appear
  $('[data-track]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
    tl.fromTo(el.querySelector('.trk-bar i'), { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: 'power2.inOut' });
    tl.fromTo($('.trk-ms li', el), { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .6, stagger: .35, ease: 'back.out(1.8)' }, .2);
  });

  // Flowchart: nodes appear top to bottom, following the arrows
  $('[data-flow]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
    tl.fromTo($(':scope > *', el), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .55, stagger: .14, ease: EASE });
    tl.fromTo($('.fl-br', el), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .5, stagger: .15, ease: EASE }, '-=.6');
  });

  // Venn: circles slide in from three directions and overlap
  $('[data-venn]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
    tl.fromTo(el.querySelector('.vc1'), { x: -60, y: -30, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 1, ease: EASE }, 0);
    tl.fromTo(el.querySelector('.vc2'), { x: 60, y: -30, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 1, ease: EASE }, .1);
    tl.fromTo(el.querySelector('.vc3'), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: EASE }, .2);
    tl.fromTo(el.querySelector('.venn-core'), { scale: 0 }, { scale: 1, duration: .7, ease: 'back.out(2.2)' }, .8);
  });

}


/* ---------------- homepage polish ---------------- */
function scrollProgress() {
  const bar = document.querySelector<HTMLElement>('.scroll-progress i');
  if (!bar) return;
  // page height is measured on resize only; scroll just schedules one cheap transform per frame
  let max = 1, queued = false;
  const measure = () => { max = Math.max(document.documentElement.scrollHeight - innerHeight, 1); paint(); };
  const paint = () => { queued = false; bar.style.transform = `scaleX(${Math.min(scrollY / max, 1)})`; };
  const on = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  const ro = new ResizeObserver(measure);
  ro.observe(document.body);
  measure();
  addEventListener('scroll', on, { passive: true });
  cleanups.push(() => { removeEventListener('scroll', on); ro.disconnect(); });
}

/** Pause looping animations and videos while they are off screen (saves CPU/GPU, especially on phones). */
function offscreenPause() {
  const els = $('.marquee, [data-hub], [data-route], .hero, .pb');
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    e.target.classList.toggle('is-offscreen', !e.isIntersecting);
    e.target.querySelectorAll<HTMLVideoElement>(':scope > .hero-media video').forEach((v) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()));
  }), { rootMargin: '100px 0px' });
  els.forEach((el) => io.observe(el));
  cleanups.push(() => io.disconnect());
}

/** Program filter tabs: sliding pill + cards fade out/in by group. */
function programFilter() {
  const tabs = document.querySelector<HTMLElement>('.pf-tabs');
  const grid = document.querySelector<HTMLElement>('.pf-grid');
  if (!tabs || !grid) return;
  const ink = tabs.querySelector<HTMLElement>('.pf-ink')!;
  const btns = $<HTMLButtonElement>('button', tabs);
  const cards = $<HTMLElement>('.pcard', grid);
  const moveInk = (b: HTMLElement) => { ink.style.width = b.offsetWidth + 'px'; ink.style.transform = `translateX(${b.offsetLeft}px)`; };
  const apply = (key: string) => {
    btns.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.filter === key)));
    moveInk(btns.find((b) => b.dataset.filter === key)!);
    const show = (c: HTMLElement) => key === 'all' || c.dataset.group === key;
    cards.forEach((c) => { if (!show(c)) c.classList.add('pf-out'); });
    setTimeout(() => {
      cards.forEach((c) => c.classList.toggle('pf-gone', !show(c)));
      const vis = cards.filter(show);
      vis.forEach((c) => c.classList.add('pf-out'));
      requestAnimationFrame(() => vis.forEach((c, k) => setTimeout(() => c.classList.remove('pf-out'), k * 70)));
      ScrollTrigger.refresh();
    }, reduce() ? 0 : 320);
  };
  btns.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter!)));
  requestAnimationFrame(() => moveInk(btns[0]));
  const onResize = () => moveInk(btns.find((b) => b.getAttribute('aria-selected') === 'true')!);
  addEventListener('resize', onResize);
  cleanups.push(() => removeEventListener('resize', onResize));
}

/** Approach cycle: light up one stage at a time while it's on screen (pauses on hover). */
function cycleHighlight() {
  const el = document.querySelector<HTMLElement>('[data-cycle]');
  if (!el) return;
  const steps = $('.cy-step', el), nodes = $('.ring-node', el);
  let k = 0, timer = 0, hover = false, visible = false;
  const set = (n: number) => { k = n % steps.length; steps.forEach((s, j) => s.classList.toggle('is-active', j === k)); nodes.forEach((s, j) => s.classList.toggle('is-active', j === k)); };
  const loop = () => { if (visible && !hover && !reduce()) set(k + 1); };
  steps.forEach((s, j) => s.addEventListener('mouseenter', () => { hover = true; set(j); }));
  el.addEventListener('mouseleave', () => (hover = false));
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: .3 });
  io.observe(el);
  set(0);
  timer = window.setInterval(loop, 2600);
  cleanups.push(() => { clearInterval(timer); io.disconnect(); });
}

/** Gentle 3D tilt + cursor glow on cards (fine pointers, motion allowed). */
function tilt() {
  if (reduce() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  $('.tile, .pf-grid .pcard, .stat, .snap-card, .ap-venue').forEach((el) => {
    el.setAttribute('data-tilt', '');
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add('tilting');
      el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
      el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`);
    };
    const leave = () => { el.classList.remove('tilting'); el.style.transform = ''; };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
  });
}

/** Before/after slider: drag or keys move the divider; one demo sweep when it first appears. */
function compareSlider() {
  $('[data-compare]').forEach((el) => {
    const range = el.querySelector<HTMLInputElement>('.cs-range')!;
    const setPos = (v: number) => { el.style.setProperty('--pos', v + '%'); range.value = String(Math.round(v)); };
    range.addEventListener('input', () => { el.classList.add('touched'); setPos(+range.value); });
    if (reduce()) return;
    const proxy = { v: 50 };
    const demo = gsap.timeline({ paused: true, onUpdate: () => { if (!el.classList.contains('touched')) setPos(proxy.v); } })
      .to(proxy, { v: 76, duration: 1.1, ease: 'power2.inOut' })
      .to(proxy, { v: 24, duration: 1.4, ease: 'power2.inOut' })
      .to(proxy, { v: 50, duration: 1, ease: 'power2.inOut' });
    ScrollTrigger.create({ trigger: el, start: 'top 70%', once: true, onEnter: () => demo.play() });
    range.addEventListener('pointerdown', () => { el.classList.add('touched'); demo.kill(); });
  });
}

function init() {
  header(); accordions(); lightbox(); contactForm(); scrollProgress(); offscreenPause(); programFilter(); cycleHighlight(); tilt();
  ctx = gsap.context(() => { subnav(); compareSlider(); if (!reduce()) motion(); });
  // fonts can shift line breaks — re-measure once loaded
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

function destroy() {
  cleanups.splice(0).forEach((f) => f());
  splits.splice(0).forEach((s) => s.revert());
  ctx?.revert(); ctx = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', destroy);
