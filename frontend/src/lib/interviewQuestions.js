/**
 * Interview question bank. Behavioral questions carry the story tags that
 * answer them; technical ones are keyed by skill (see lib/skills.js).
 */
export const BEHAVIORAL = [
  { q: 'Tell me about yourself.', tags: ['impact', 'ownership'] },
  { q: 'Why are you looking right now?', tags: [], tip: 'Short and positive: "My role was cut in a company-wide layoff. I\'m looking for a team where I can own full stack features again."' },
  { q: 'Tell me about a project you owned end to end.', tags: ['ownership', 'impact'] },
  { q: 'Tell me about a time you disagreed with a teammate or lead.', tags: ['conflict', 'communication'] },
  { q: 'Tell me about a production bug you had to fix under pressure.', tags: ['debugging', 'pressure'] },
  { q: 'Tell me about a time you had to learn something new quickly.', tags: ['learning', 'growth'] },
  { q: 'Tell me about a mistake you made and what you changed afterwards.', tags: ['growth', 'debugging'] },
  { q: 'How do you work with product and design when requirements are unclear?', tags: ['communication', 'teamwork'] },
  { q: 'What are you most proud of building?', tags: ['impact', 'ownership'] },
  { q: 'Why do you want to work here?', tags: [], tip: 'Name one thing about the product, one about the team, and one about the role.' },
];

export const TECHNICAL = {
  react: [
    'How does React decide when to re-render, and how do you prevent unnecessary renders?',
    'When would you use useMemo or useCallback, and when are they a waste?',
    'How do you manage server state vs. client state in a React app?',
  ],
  typescript: [
    'What is the difference between an interface and a type alias?',
    'How do generics help you write a reusable API client?',
  ],
  javascript: [
    'Explain the event loop: microtasks vs. macrotasks.',
    'What is a closure, and where have you used one on purpose?',
  ],
  node: [
    'How does Node handle concurrency with a single thread?',
    'How would you structure a Node service so it stays maintainable as it grows?',
  ],
  sql: [
    'Walk me through how you would find and fix a slow query.',
    'When would you add an index, and what does it cost you?',
    'Explain the difference between INNER, LEFT and a correlated subquery.',
  ],
  payments: [
    'How do you make a payment webhook handler idempotent?',
    'Walk me through a subscription lifecycle: trial, upgrade, failed payment, cancel.',
    'How would you test billing logic without charging real cards?',
  ],
  rest: [
    'How do you design a REST API for a resource with nested relationships?',
    'How do you version an API without breaking clients?',
  ],
  microservices: ['When would you split something into its own service, and when is that a mistake?'],
  system_design: [
    'Design a subscription billing system.',
    'Design a URL shortener. How does it scale to 100M links?',
    'How would you design a job queue that retries safely?',
  ],
  testing: [
    'What do you unit test vs. integration test vs. end-to-end test?',
    'How do you test a component that fetches data?',
  ],
  aws: ['Which AWS services have you used, and how would you deploy a Node API on AWS?'],
  docker: ['Why containerise an app, and what goes in a good Dockerfile?'],
  cicd: ['What does a good CI pipeline check before code reaches production?'],
  graphql: ['GraphQL vs. REST: when would you pick each?'],
  redis: ['What would you cache in Redis, and how do you invalidate it?'],
  performance: ['A page is slow. Walk me through how you find out why.'],
  accessibility: ['How do you make a custom dropdown accessible?'],
  ai: ['How would you add an LLM feature to a product safely and cheaply?'],
};

export const ASK_THEM = [
  'What does success look like in this role after 90 days?',
  'What is the team working on right now, and what is hardest about it?',
  'How do you ship: how often, and who reviews code?',
  'What made the last person in this role successful?',
  'What are the next steps, and is there anything that worries you about my background?',
];

/** Questions to prep for one job, from the skills its posting mentions. */
export function prepFor(skills) {
  const technical = skills
    .filter((s) => TECHNICAL[s.key])
    .flatMap((s) => TECHNICAL[s.key].slice(0, 2).map((q) => ({ q, skill: s.label })));
  return { behavioral: BEHAVIORAL, technical, askThem: ASK_THEM };
}

/** Every question, flat, for the daily drill. */
export const ALL_QUESTIONS = [
  ...BEHAVIORAL.map((b) => ({ q: b.q, kind: 'Behavioral', tags: b.tags, tip: b.tip })),
  ...Object.entries(TECHNICAL).flatMap(([key, list]) => list.map((q) => ({ q, kind: 'Technical', skill: key }))),
];
