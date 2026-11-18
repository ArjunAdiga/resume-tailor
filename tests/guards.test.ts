import { describe, expect, it } from 'vitest'
import { checkBullet } from '../src/lib/guards'

type Case = {
  name: string
  original: string
  proposed: string
  resumeText?: string
  expected?: string
}

const accepted: Case[] = [
  {
    name: 'rephrases a verb',
    original: 'Built reusable React components.',
    proposed: 'Created reusable React components.',
  },
  {
    name: 'keeps the same percentage',
    original: 'Improved load time by 20%.',
    proposed: 'Reduced load time by 20%.',
  },
  {
    name: 'keeps existing frameworks',
    original: 'Used TypeScript and Next.js daily.',
    proposed: 'Used TypeScript and Next.js each day.',
  },
  {
    name: 'changes no tech terms',
    original: 'Wrote unit tests for form validation.',
    proposed: 'Added unit tests for form validation.',
  },
  {
    name: 'reorders words',
    original: 'Built responsive CSS layouts.',
    proposed: 'Built CSS layouts that adapt.',
  },
  {
    name: 'keeps count and year',
    original: 'Shipped 3 features in 2024.',
    proposed: 'Delivered 3 features in 2024.',
  },
  {
    name: 'keeps tool and metric',
    original: 'Raised test coverage to 80% with Vitest.',
    proposed: 'Boosted test coverage to 80% with Vitest.',
  },
  {
    name: 'keeps an existing tool',
    original: 'Used React in the customer-facing project.',
    proposed: 'Used React in the customer-facing project daily.',
  },
  {
    name: 'uses a term from the full resume',
    original: 'Built the internal dashboard for the product team.',
    proposed: 'Built the React internal dashboard for the product team.',
    resumeText: 'Skills: React, TypeScript.',
  },
  {
    name: 'matches terms case-insensitively',
    original: 'Used react at work.',
    proposed: 'Used React at work.',
  },
  {
    name: 'keeps a multi-word term',
    original: 'Worked with Node.js services at the lab.',
    proposed: 'Built Node.js services at the lab.',
  },
  {
    name: 'makes a small expansion',
    original: 'Fixed accessibility issues in the app.',
    proposed: 'Fixed accessibility issues in the web app.',
  },
]

const rejected: Case[] = [
  {
    name: 'invented metric',
    original: 'Improved load time by 20%.',
    proposed: 'Cut load time by 40%.',
    expected: 'numbers',
  },
  {
    name: 'invented tool Kubernetes',
    original: 'Built web pages with React.',
    proposed: 'Used Kubernetes to build web pages.',
    expected: 'Kubernetes',
  },
  {
    name: 'empty bullet',
    original: 'Built React components.',
    proposed: '',
    expected: 'empty',
  },
  {
    name: 'identical bullet',
    original: 'Built React components.',
    proposed: 'Built React components.',
    expected: 'identical',
  },
  {
    name: 'LaTeX command',
    original: 'Built React components.',
    proposed: 'Built \\textbf{React} components.',
    expected: 'LaTeX',
  },
  {
    name: 'newline',
    original: 'Built React components.',
    proposed: 'Built React\ncomponents.',
    expected: 'newline',
  },
  {
    name: 'much longer',
    original: 'Built React components.',
    proposed: 'Built React components and shipped a new dashboard with tests.',
    expected: 'length',
  },
  {
    name: 'much shorter',
    original: 'Built reusable React components for the customer dashboard used by internal teams.',
    proposed: 'Built components.',
    expected: 'length',
  },
  {
    name: 'invented plain number',
    original: 'Shipped features.',
    proposed: 'Shipped 5 features.',
    expected: 'numbers',
  },
  {
    name: 'invented state library',
    original: 'Built a dashboard for the internal product team.',
    proposed: 'Built a Redux dashboard for the internal product team.',
    expected: 'Redux',
  },
  {
    name: 'invented percentage',
    original: 'Reduced bugs in tests.',
    proposed: 'Reduced bugs by 30% in tests.',
    expected: 'numbers',
  },
  {
    name: 'invented database',
    original: 'Worked on the API.',
    proposed: 'Worked on the PostgreSQL API.',
    expected: 'PostgreSQL',
  },
  {
    name: 'invented cloud provider',
    original: 'Deployed the site.',
    proposed: 'Deployed the site on AWS.',
    expected: 'AWS',
  },
  {
    name: 'invented framework',
    original: 'Built a web app.',
    proposed: 'Built a Vue web app.',
    expected: 'Vue',
  },
  {
    name: 'added duration to an existing metric',
    original: 'Improved speed by 10%.',
    proposed: 'Improved speed by 10% in 2 weeks.',
    expected: 'numbers',
  },
]

describe('checkBullet', () => {
  it.each(accepted)('accepts $name', ({ original, proposed, resumeText }) => {
    expect(checkBullet(original, proposed, resumeText ?? original)).toEqual({
      ok: true,
      reasons: [],
    })
  })

  it.each(rejected)('rejects $name', ({ original, proposed, resumeText, expected }) => {
    const result = checkBullet(original, proposed, resumeText ?? original)
    expect(result.ok).toBe(false)
    expect(result.reasons.join(' ')).toContain(expected ?? '')
  })
})
