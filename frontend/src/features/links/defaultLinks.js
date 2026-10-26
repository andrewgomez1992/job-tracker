/** Starting set for My links. Edit them in the app; changes are saved in this browser. */
export const DEFAULT_GROUPS = [
  {
    id: 'links',
    title: 'Links',
    items: [
      { id: 'linkedin', label: 'LinkedIn', value: 'https://www.linkedin.com/in/andrewgomez1992', kind: 'link' },
      { id: 'github', label: 'GitHub', value: 'https://github.com/andrewgomez1992', kind: 'link' },
      { id: 'portfolio', label: 'Portfolio', value: 'https://drew-gomez.com', kind: 'link' },
      { id: 'resume', label: 'Resume (PDF)', value: 'https://drew-gomez.com/Andrew_Gomez_Resume.pdf', kind: 'link' },
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    items: [
      { id: 'trail-demo', label: 'Trail live demo', value: 'https://job-tracker-two-bay.vercel.app', kind: 'link' },
      { id: 'trail-code', label: 'Trail code', value: 'https://github.com/andrewgomez1992/job-tracker', kind: 'link' },
      { id: 'fieldvoice', label: 'FieldVoice code', value: 'https://github.com/andrewgomez1992/fieldvoice', kind: 'link' },
      { id: 'nodeforge', label: 'The Node Forge (npm)', value: 'https://www.npmjs.com/org/the-node-forge', kind: 'link' },
      { id: 'vanish', label: 'Vanish Candles demo', value: 'https://vanish-candles.vercel.app', kind: 'link' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    items: [
      { id: 'email', label: 'Email', value: 'drewgomez209@gmail.com', kind: 'text' },
      { id: 'phone', label: 'Phone', value: '209.404.3585', kind: 'text' },
      { id: 'location', label: 'Location', value: 'Modesto, CA (open to remote or hybrid)', kind: 'text' },
    ],
  },
  {
    id: 'answers',
    title: 'Common answers',
    items: [
      { id: 'years', label: 'Years of experience', value: '4', kind: 'text' },
      { id: 'salary', label: 'Salary expectation', value: '$140,000 base', kind: 'text' },
      { id: 'pitch', label: 'Short summary', value: 'Full stack engineer with 4 years shipping production features on a SaaS platform with 50,000+ users. Built subscription, free-trial and billing systems end to end, from Node.js microservices and SQL to React checkout flows integrated with Recurly. Strongest in React, TypeScript, Node.js and payments.', kind: 'text' },
    ],
  },
];
