/**
 * The skills Trail knows how to spot in a job posting or a resume. Shared by
 * the resume match and the interview prep cards.
 */
export const SKILLS = [
  { key: 'react', label: 'React', re: /\breact(\.js|js)?\b/i },
  { key: 'typescript', label: 'TypeScript', re: /\btypescript\b|\bts\b/i },
  { key: 'javascript', label: 'JavaScript', re: /\bjavascript\b|\bes6\b/i },
  { key: 'node', label: 'Node.js', re: /\bnode(\.js|js)?\b/i },
  { key: 'express', label: 'Express', re: /\bexpress(\.js)?\b/i },
  { key: 'nestjs', label: 'NestJS', re: /\bnest(\.js|js)\b/i },
  { key: 'nextjs', label: 'Next.js', re: /\bnext(\.js|js)\b/i },
  { key: 'redux', label: 'Redux', re: /\bredux\b/i },
  { key: 'vue', label: 'Vue', re: /\bvue(\.js)?\b/i },
  { key: 'angular', label: 'Angular', re: /\bangular\b/i },
  { key: 'html_css', label: 'HTML/CSS', re: /\bhtml5?\b|\bcss3?\b|\bsass\b|tailwind/i },
  { key: 'sql', label: 'SQL', re: /\bsql\b|mysql|postgres(ql)?|relational database/i },
  { key: 'postgres', label: 'PostgreSQL', re: /postgres(ql)?/i },
  { key: 'mysql', label: 'MySQL', re: /\bmysql\b/i },
  { key: 'mongodb', label: 'MongoDB', re: /\bmongo(db)?\b/i },
  { key: 'redis', label: 'Redis', re: /\bredis\b/i },
  { key: 'graphql', label: 'GraphQL', re: /\bgraphql\b/i },
  { key: 'rest', label: 'REST APIs', re: /\brest(ful)?\b|\bapis?\b/i },
  { key: 'microservices', label: 'Microservices', re: /micro-?services?/i },
  { key: 'aws', label: 'AWS', re: /\baws\b|amazon web services|\blambda\b|\bs3\b|\bec2\b/i },
  { key: 'gcp', label: 'GCP', re: /\bgcp\b|google cloud/i },
  { key: 'azure', label: 'Azure', re: /\bazure\b/i },
  { key: 'docker', label: 'Docker', re: /\bdocker\b|container/i },
  { key: 'kubernetes', label: 'Kubernetes', re: /kubernetes|\bk8s\b/i },
  { key: 'cicd', label: 'CI/CD', re: /ci\/cd|continuous (integration|delivery|deployment)|github actions|jenkins/i },
  { key: 'testing', label: 'Testing', re: /\btest(s|ing|ed)?\b|\bjest\b|cypress|playwright|\btdd\b/i },
  { key: 'jest', label: 'Jest', re: /\bjest\b/i },
  { key: 'cypress', label: 'Cypress', re: /cypress/i },
  { key: 'payments', label: 'Payments/billing', re: /payments?|billing|subscription|checkout|stripe|recurly|invoic/i },
  { key: 'stripe', label: 'Stripe', re: /\bstripe\b/i },
  { key: 'system_design', label: 'System design', re: /system design|architect|scalab|distributed/i },
  { key: 'performance', label: 'Performance', re: /performance|optimi[sz]/i },
  { key: 'accessibility', label: 'Accessibility', re: /accessib|\ba11y\b|wcag/i },
  { key: 'agile', label: 'Agile', re: /\bagile\b|\bscrum\b|sprint/i },
  { key: 'python', label: 'Python', re: /\bpython\b|django|flask|fastapi/i },
  { key: 'java', label: 'Java', re: /\bjava\b|spring boot/i },
  { key: 'go', label: 'Go', re: /\bgolang\b|\bgo\b(?= (or|and|,))/i },
  { key: 'ai', label: 'AI/LLMs', re: /\bllms?\b|\bai\b|machine learning|openai|anthropic|genai/i },
  { key: 'mobile', label: 'Mobile', re: /react native|\bios\b|android|mobile app/i },
  { key: 'webhooks', label: 'Webhooks', re: /webhooks?/i },
];

/** Which skills does this text mention? Returns skill objects in list order. */
export const detectSkills = (text = '') => SKILLS.filter((s) => s.re.test(text));
