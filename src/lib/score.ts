import { parse } from './latex/parse'
import type { Jd } from './schemas'

const ALIASES: Record<string, string> = {
  js: 'javascript',
  k8s: 'kubernetes',
  node: 'node.js',
}

export function normalize(value: string): string {
  const lower = value.toLowerCase().trim().replace(/\s+/g, ' ')
  return lower.replace(/(?<![.\w])\b(js|k8s|node)\b(?![.\w])/g, (term) => ALIASES[term] ?? term)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsTerm(text: string, term: string): boolean {
  const needle = normalize(term)
  if (needle.length === 0) return false
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`)
  return pattern.test(normalize(text))
}

export type Coverage = {
  present: string[]
  missing: string[]
  ratio: number
}

function coverage(terms: string[], text: string): Coverage {
  const seen = new Set<string>()
  const unique = terms.filter((term) => {
    const key = term.trim().toLowerCase()
    if (key.length === 0 || seen.has(key)) return false
    seen.add(key)
    return true
  })
  const present = unique.filter((term) => containsTerm(text, term))
  const missing = unique.filter((term) => !containsTerm(text, term))
  return {
    present,
    missing,
    ratio: unique.length === 0 ? 0 : present.length / unique.length,
  }
}

function numericShare(bullets: { text: string }[]): {
  count: number
  total: number
  share: number
} {
  const count = bullets.filter((bullet) => /\d/.test(bullet.text)).length
  return {
    count,
    total: bullets.length,
    share: bullets.length === 0 ? 0 : count / bullets.length,
  }
}

export type ScoreResult = {
  present: string[]
  missing: string[]
  score: number
  breakdown: {
    required: Coverage
    niceToHave: Coverage
    numbers: { count: number; total: number; share: number }
  }
}

export function score(jd: Jd, tex: string): ScoreResult {
  const keywords = coverage(jd.keywords, tex)
  const required = coverage(jd.requiredSkills, tex)
  const niceToHave = coverage(jd.niceToHaveSkills, tex)
  const numbers = numericShare(parse(tex))
  const value =
    0.7 * required.ratio + 0.2 * niceToHave.ratio + 0.1 * numbers.share

  return {
    present: keywords.present,
    missing: keywords.missing,
    score: Math.round(value * 100),
    breakdown: { required, niceToHave, numbers },
  }
}
