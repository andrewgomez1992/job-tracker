import { detectSkills, SKILLS } from './skills.js';

export const RESUME_KEY = 'trail.resume';

/** Starting point; edit it on the Tools page. */
export const DEFAULT_RESUME = `Full stack engineer with 4 years shipping production features on a SaaS platform with 50,000+ users.
Built subscription, free-trial and billing systems end to end, from Node.js microservices and SQL to React checkout flows integrated with Recurly.

Front end: React, TypeScript, JavaScript, Vite, Redux, Context API, Styled Components, HTML, CSS, Axios
Back end: Node.js, NestJS, Express, REST APIs, microservices, webhooks, Redis
Data: SQL, MySQL, Knex.js, MongoDB, Firebase
Payments: Recurly, Stripe
Cloud and testing: AWS, Jest, Cypress, ESLint

Thryv - Product Web Developer, Full Stack (2022 - 2026)
- Stood up a new Node.js microservice repo for the free-trial program and built it end to end, from API endpoints to the React checkout
- Built the checkout and subscription flow with Recurly billing integration
- Shipped and maintained production features across the React/Vite front end and Node.js back end
- Wrote and optimized SQL with MySQL and Knex
- Partnered with tech leads, QA, design and product in an Agile team

Projects: Regex Simplifier (TypeScript, Jest NPM package), Vanish Candles (React, TypeScript, NestJS, Stripe), FieldVoice (AI voice reporting app)`;

export const readResume = () => {
  try { return JSON.parse(localStorage.getItem(RESUME_KEY)) || DEFAULT_RESUME; } catch { return DEFAULT_RESUME; }
};

const BONUS = /bonus|nice to have|preferred|a plus|plus:|ideally/i;

/**
 * Compare a posting with a resume. Required skills count fully, "nice to
 * have" ones count half.
 */
export function matchResume(posting, resume) {
  const lines = posting.split(/\n+/);
  const weight = new Map();
  let inBonus = false;
  for (const line of lines) {
    if (/^\s*[A-Z][^.]{0,40}:?\s*$/.test(line) && !/^\s*-/.test(line)) inBonus = BONUS.test(line);
    const bonus = inBonus || BONUS.test(line);
    for (const s of detectSkills(line)) weight.set(s.key, Math.max(weight.get(s.key) ?? 0, bonus ? 0.5 : 1));
  }
  const have = new Set(detectSkills(resume).map((s) => s.key));
  const wanted = SKILLS.filter((s) => weight.has(s.key));
  const matched = wanted.filter((s) => have.has(s.key));
  const missing = wanted.filter((s) => !have.has(s.key));
  const total = wanted.reduce((n, s) => n + weight.get(s.key), 0);
  const got = matched.reduce((n, s) => n + weight.get(s.key), 0);
  const score = total ? Math.round((got / total) * 100) : 0;

  const tips = [];
  const required = missing.filter((s) => weight.get(s.key) === 1);
  if (required.length) tips.push(`If you've used ${required.slice(0, 3).map((s) => s.label).join(', ')} at all, add it to your skills line. Applicant-tracking filters look for exact words.`);
  if (matched.length) tips.push(`Lead your summary with ${matched.slice(0, 3).map((s) => s.label).join(', ')}. Those are the overlaps they'll scan for.`);
  if (/payments|billing|subscription/i.test(posting)) tips.push('They care about payments: put the free-trial and Recurly billing bullet first.');
  if (/senior|lead/i.test(posting)) tips.push('Senior role: make sure a bullet shows you owned something end to end and mentored or led.');
  if (score >= 80) tips.push('Strong match. Apply today and reach out to someone on the team.');

  return { score, matched, missing, weight, tips };
}
