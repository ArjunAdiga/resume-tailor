import { describe, expect, it } from 'vitest'
import { normalize, score } from '../src/lib/score'
import type { Jd } from '../src/lib/schemas'

type Case = {
  name: string
  jd: Jd
  tex: string
  present: string[]
  missing: string[]
  score: number
  numbers: { count: number; total: number; share: number }
}

const cases: Case[] = [
  {
    name: 'all terms covered',
    jd: {
      roleTitle: 'Frontend Engineer',
      requiredSkills: ['React', 'TypeScript'],
      niceToHaveSkills: ['Vitest'],
      keywords: ['React', 'TypeScript', 'Vitest'],
    },
    tex: '\\resumeItem{Built React and TypeScript in 2024 with Vitest.}',
    present: ['React', 'TypeScript', 'Vitest'],
    missing: [],
    score: 100,
    numbers: { count: 1, total: 1, share: 1 },
  },
  {
    name: 'partial coverage',
    jd: {
      roleTitle: 'Frontend Engineer',
      requiredSkills: ['React', 'GraphQL'],
      niceToHaveSkills: ['Docker', 'Vitest'],
      keywords: ['React', 'GraphQL', 'Docker'],
    },
    tex: '\\resumeItem{Built React UI.} \\resumeItem{Wrote Vitest tests that cut bugs by 20\\%.}',
    present: ['React'],
    missing: ['GraphQL', 'Docker'],
    score: 50,
    numbers: { count: 1, total: 2, share: 0.5 },
  },
  {
    name: 'aliases match canonical terms',
    jd: {
      roleTitle: 'Platform Engineer',
      requiredSkills: ['javascript', 'kubernetes', 'node.js'],
      niceToHaveSkills: [],
      keywords: ['js', 'k8s', 'node'],
    },
    tex: '\\resumeItem{Used JS, K8s and Node in 2023.}',
    present: ['js', 'k8s', 'node'],
    missing: [],
    score: 80,
    numbers: { count: 1, total: 1, share: 1 },
  },
  {
    name: 'deduplicates repeated keywords',
    jd: {
      roleTitle: '',
      requiredSkills: ['React'],
      niceToHaveSkills: [],
      keywords: ['React', 'react', 'React'],
    },
    tex: '\\resumeItem{Built React apps in 2024.}',
    present: ['React'],
    missing: [],
    score: 80,
    numbers: { count: 1, total: 1, share: 1 },
  },
  {
    name: 'empty inputs',
    jd: {
      roleTitle: '',
      requiredSkills: [],
      niceToHaveSkills: [],
      keywords: [],
    },
    tex: '',
    present: [],
    missing: [],
    score: 0,
    numbers: { count: 0, total: 0, share: 0 },
  },
]

describe('normalize', () => {
  it.each([
    ['JS', 'javascript'],
    ['K8s', 'kubernetes'],
    ['Node', 'node.js'],
    ['Node.js', 'node.js'],
    ['  TypeScript  ', 'typescript'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalize(input)).toBe(expected)
  })
})

describe('score', () => {
  it.each(cases)('$name', ({ jd, tex, present, missing, score: expected, numbers }) => {
    const result = score(jd, tex)
    expect(result.present).toEqual(present)
    expect(result.missing).toEqual(missing)
    expect(result.score).toBe(expected)
    expect(result.breakdown.numbers).toEqual(numbers)
  })

  it('reports required and nice-to-have coverage separately', () => {
    const result = score(cases[1]!.jd, cases[1]!.tex)
    expect(result.breakdown.required).toEqual({
      present: ['React'],
      missing: ['GraphQL'],
      ratio: 0.5,
    })
    expect(result.breakdown.niceToHave).toEqual({
      present: ['Vitest'],
      missing: ['Docker'],
      ratio: 0.5,
    })
  })
})
