import { album } from './photos';
import data from '../data/content.json';

export const { CONTACT, HOME, TRAINER, TRAINER_SHORT, GENERIC_TESTIMONIALS } = data;
export type Client = { name: string; folder?: string; where?: string; key?: string };
export const CLIENTS = data.CLIENTS as Client[];
export type Work = (typeof data.WORK)[number] & Record<string, any>;
// Curated engagements from content.json, plus an automatic entry for any client whose photos were imported
export const WORK: Work[] = [
  ...(data.WORK as Work[]),
  ...CLIENTS.filter((c) => c.key && !data.WORK.some((w) => w.key === c.key) && album(c.key).length).map((c) => ({
    key: c.key!, client: c.name, kind: 'Jewellery business', program: '[Program — confirm]', program_slug: '',
    when: '[Date]', where: c.where ?? '[City]', blurb: `Inside a DG Trainings session with the ${c.name} team.`,
  }) as Work),
];
export const workFor = (slug: string) => WORK.filter((w) => w.program_slug === slug);
export type Program = (typeof data.PROGRAMS)[number] & Record<string, any>;
export const PROGRAMS = data.PROGRAMS as Program[];
export const SIGNATURE = PROGRAMS.filter((p) => !p.extra);
export const bySlug = (slug: string) => PROGRAMS.find((p) => p.slug === slug)!;
/** The three themes used by the Programs menu and the home-page filter, with short menu labels. */
export const GROUPS = [
  { key: 'lead', title: 'Leadership & culture', items: [['management-training', 'Management'], ['leadership-training', 'Leadership for HODs'], ['life-work-culture-transformation', 'Life & Work Culture']] },
  { key: 'sales', title: 'Sales & marketing', items: [['business-technical-sales-expert', 'Business & Technical – Sales Expert'], ['marketing-training', 'Marketing'], ['sales-tour-training', 'Sales Tour']] },
  { key: 'teams', title: 'Teams, events & digital', items: [['exhibitions-training', 'Exhibition'], ['digital-shakti', 'Digital Shakti & Smartphone'], ['orientation-training', 'Orientation']] },
] as const;
export const groupOf = (slug: string) => GROUPS.find((g) => g.items.some(([s]) => s === slug))?.key ?? '';

const esc = (s: string) => s.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Escape text; render [..] as a highlighted "to confirm" placeholder; allow <b> from content. */
export function rich(text: string): string {
  return esc(text)
    .replace(/&lt;(\/?)b&gt;/g, '<$1b>')
    .replace(/\[([^\]]+)\]/g, '<mark class="tbc" title="Placeholder — to confirm">$1</mark>');
}

/** Splits "A · B · C" into ["A","B","C"]. */
export const dots = (s: string) => s.split(/\s*·\s*/).filter(Boolean);

export const tel = (n: string) => 'tel:' + n.replace(/\s/g, '');
export const wa = (msg = 'Hi DG Trainings, I would like to know more about your training programs.') =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`;
export const progUrl = (p: Program) => `/programs/${p.slug}/`;
