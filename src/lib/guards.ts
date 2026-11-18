import { TECH_TERMS } from './techTerms'

const NUMBER = /(?<![\w.])\d+(?:\.\d+)?%?(?![\w.])/g
const TERM_BY_LOWER = new Map(TECH_TERMS.map((term) => [term.toLowerCase(), term]))

export type GuardResult = {
  ok: boolean
  reasons: string[]
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function numbers(text: string): string[] {
  return text.match(NUMBER) ?? []
}

function termsIn(text: string): Set<string> {
  const found = new Set<string>()
  for (const term of TECH_TERMS) {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}([^a-z0-9]|$)`, 'i')
    if (pattern.test(text)) found.add(term.toLowerCase())
  }
  return found
}

export function checkBullet(
  original: string,
  proposed: string,
  resumeText: string,
): GuardResult {
  const reasons: string[] = []

  if (proposed.trim().length === 0) reasons.push('is empty')
  if (proposed.trim() === original.trim()) reasons.push('is identical to the original')
  if (proposed.includes('\\')) reasons.push('contains LaTeX commands')
  if (/[\r\n]/.test(proposed)) reasons.push('contains newlines')

  const originalNumbers = numbers(original)
  const addedNumbers = numbers(proposed).filter((value) => !originalNumbers.includes(value))
  if (addedNumbers.length > 0) {
    reasons.push(`adds numbers not in the original: ${addedNumbers.join(', ')}`)
  }

  const known = new Set([...termsIn(resumeText), ...termsIn(original)])
  const invented = [...termsIn(proposed)]
    .filter((term) => !known.has(term))
    .map((term) => TERM_BY_LOWER.get(term) ?? term)
  if (invented.length > 0) {
    reasons.push(`adds tech terms not in the resume: ${invented.join(', ')}`)
  }

  if (
    original.length === 0 ||
    Math.abs(proposed.length - original.length) / original.length > 0.15
  ) {
    reasons.push('changes length by more than 15 percent')
  }

  return { ok: reasons.length === 0, reasons }
}
