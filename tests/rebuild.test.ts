import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse } from '../src/lib/latex/parse'
import { rebuild } from '../src/lib/latex/rebuild'

const sample = readFileSync(
  fileURLToPath(new URL('../samples/resume.sample.tex', import.meta.url)),
  'utf8',
)

describe('rebuild', () => {
  it('returns the exact original with no replacements', () => {
    expect(rebuild(sample, [])).toBe(sample)
  })

  it('changes only the targeted bullet', () => {
    const bullets = parse(sample)
    const target = bullets[3]!
    const newText = 'Rewritten bullet about shipped frontend work.'
    const result = rebuild(sample, [{ id: target.id, newText }])

    expect(result).toBe(
      sample.slice(0, target.start) + newText + sample.slice(target.end),
    )
    const rewritten = parse(result)
    expect(rewritten).toHaveLength(bullets.length)
    expect(rewritten[3]?.text).toBe(newText)
    for (const i of bullets.keys()) {
      if (i !== 3) expect(rewritten[i]?.text).toBe(bullets[i]?.text)
    }
  })

  it('applies multiple replacements without shifting offsets', () => {
    const bullets = parse(sample)
    const first = bullets[1]!
    const last = bullets[bullets.length - 1]!
    const result = rebuild(sample, [
      { id: first.id, newText: 'First new bullet.' },
      { id: last.id, newText: 'Last new bullet.' },
    ])

    const rewritten = parse(result)
    expect(rewritten[1]?.text).toBe('First new bullet.')
    expect(rewritten[rewritten.length - 1]?.text).toBe('Last new bullet.')
  })

  it('ignores unknown ids', () => {
    expect(rebuild(sample, [{ id: 'missing', newText: 'nope' }])).toBe(sample)
  })
})
