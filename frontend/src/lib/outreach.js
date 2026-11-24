/**
 * Outreach copy and people-search links, shared by the per-application
 * Outreach tab and Reach-out mode.
 *
 * Tone: a full stack engineer with range. The trial program is a team effort
 * Drew was part of, not his solo project, so the copy says so and doesn't lead with it.
 */

const li = (q) => `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
const google = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

/** Free LinkedIn connection notes are capped at 200 characters. */
export const NOTE_LIMIT = 200;

export function peopleSearches(company) {
  return [
    { id: 'recruiter', label: 'Recruiters', hint: 'Start here', href: li(`${company} technical recruiter`) },
    { id: 'hiring_manager', label: 'Engineering managers', hint: 'Likely the hiring manager', href: li(`${company} engineering manager`) },
    { id: 'peer', label: 'Software engineers', hint: 'Ask about the work', href: li(`${company} software engineer`) },
    { id: 'alumni', label: 'BloomTech alumni', hint: 'Warmest cold contact', href: li(`${company} BloomTech Lambda School`) },
    { id: 'xray', label: 'Google X-ray', hint: 'Finds profiles LinkedIn hides', href: google(`site:linkedin.com/in "${company}" ("engineering manager" OR recruiter OR "software engineer")`) },
  ];
}

export function buildTemplates({ company, role, applied }) {
  const did = applied ? 'just applied' : 'am applying';
  return [
    {
      id: 'note',
      label: 'Connect note',
      who: 'Anyone: recruiter, manager or engineer',
      text: `Hi {name}, I ${did} for the ${role} role at ${company}. Full stack engineer (React/Node/TS), 4 yrs on a SaaS platform. Would love to connect!`,
    },
    {
      id: 'recruiter',
      label: 'Recruiter',
      who: 'Talent / technical recruiter at the company',
      text: `Hi {name}, I ${did} for the ${role} position at ${company} and wanted to reach out directly.

I'm a full stack engineer with 4 years at Thryv, shipping features across the front end and back end (React, TypeScript, Node.js, SQL) on a SaaS platform with 50,000+ users. That included being part of the team that launched a free-trial program.

I think the role lines up well with my experience and would love to know if I might be a fit. Happy to share more anytime. Thanks!

Drew
drew-gomez.com`,
    },
    {
      id: 'manager',
      label: 'Hiring manager',
      who: 'Engineering manager / team lead likely hiring',
      text: `Hi {name}, I saw ${company} is hiring a ${role} and I ${did}. I'd guess it's on your team, or close to it.

Quick context: I've spent 4 years shipping full stack features (React, TypeScript, Node, SQL) on a 50k-user SaaS. Outside work I built Trail, a full stack job tracker with a live demo, and published a few TypeScript packages on npm. [One line on why this company or product specifically.]

If you're open to a 15 minute chat about what the team is working on, I'd really appreciate it.

Drew`,
    },
    {
      id: 'engineer',
      label: 'Engineer',
      who: 'An engineer on the team. Ask about the work, not for a job.',
      text: `Hi {name}, I'm looking at the ${role} opening at ${company} and saw you're on the engineering team. Would you be up for a quick 10 minute chat about what it's like there and the stack you work in?

I'm a full stack engineer (React/Node) and want to make sure it's a real fit before I go all in. No pressure at all. Thanks!`,
    },
    {
      id: 'followup',
      label: 'Follow-up',
      who: 'Send 5 to 7 days after no reply',
      text: `Hi {name}, just bumping this in case it got buried. Still very interested in the ${role} role at ${company}. Happy to send a resume or anything else that helps. Thanks either way!`,
    },
  ];
}
