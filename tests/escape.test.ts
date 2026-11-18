import { describe, expect, it } from 'vitest'
import { escape } from '../src/lib/latex/escape'

const cases = [
  ['\\', '\\textbackslash{}'],
  ['&', '\\&'],
  ['%', '\\%'],
  ['$', '\\$'],
  ['#', '\\#'],
  ['_', '\\_'],
  ['{', '\\{'],
  ['}', '\\}'],
  ['~', '\\textasciitilde{}'],
  ['^', '\\textasciicircum{}'],
] as const

describe('escape', () => {
  it.each(cases)('escapes %s', (input, expected) => {
    expect(escape(input)).toBe(expected)
  })

  it('escapes all special characters in one pass', () => {
    const input = '\\ & % $ # _ { } ~ ^'
    expect(escape(input)).toBe(
      '\\textbackslash{} \\& \\% \\$ \\# \\_ \\{ \\} \\textasciitilde{} \\textasciicircum{}',
    )
  })

  it('leaves ordinary text unchanged', () => {
    expect(escape('Hello, world! 123')).toBe('Hello, world! 123')
  })
})
