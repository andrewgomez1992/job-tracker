/**
 * The "Save to Trail" bookmarklet. It runs on a job posting (LinkedIn,
 * Indeed, Greenhouse, Lever, Ashby or anything else), grabs the title,
 * company, link and description, and opens Trail's /save page with them.
 * If you highlight text first, the highlight becomes the description.
 */
const source = (origin) => `(() => {
  const q = (s) => { const el = document.querySelector(s); return el ? el.innerText.trim() : ''; };
  const meta = (p) => { const el = document.querySelector('meta[property="' + p + '"]'); return el ? el.content : ''; };
  const sel = String(window.getSelection()).trim();
  const role = q('.job-details-jobs-unified-top-card__job-title') || q('.top-card-layout__title')
    || q('h1.jobsearch-JobInfoHeader-title') || q('.app-title') || q('.posting-headline h2') || q('h1') || meta('og:title') || document.title;
  const company = q('.job-details-jobs-unified-top-card__company-name') || q('.topcard__org-name-link')
    || q('[data-testid="inlineHeader-companyName"]') || q('[data-company-name]') || q('.company-name')
    || meta('og:site_name') || '';
  const description = sel || q('#job-details') || q('.jobs-description__content') || q('.description__text')
    || q('#jobDescriptionText') || q('#content') || q('.posting-page') || q('main') || '';
  const data = { role: role.split('\\n')[0].slice(0, 200), company: company.split('\\n')[0].slice(0, 200),
    url: location.href.split('?')[0], host: location.hostname, description: description.slice(0, 8000) };
  window.open('${origin}/save#' + encodeURIComponent(JSON.stringify(data)), '_blank');
})()`;

export const bookmarkletHref = (origin) => `javascript:${encodeURIComponent(source(origin))}`;

const SOURCES = [
  [/linkedin/, 'LinkedIn'], [/indeed/, 'Indeed'], [/wellfound|angel/, 'Wellfound'], [/greenhouse/, 'Company site'],
  [/lever\.co/, 'Company site'], [/ashby/, 'Company site'], [/builtin/, 'Built In'], [/dice/, 'Dice'], [/glassdoor/, 'Glassdoor'],
];
export const sourceFromHost = (host = '') => SOURCES.find(([re]) => re.test(host))?.[1] ?? 'Company site';
