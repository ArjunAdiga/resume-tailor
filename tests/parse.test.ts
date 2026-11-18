import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse, parseSkills } from '../src/lib/latex/parse'

const sample = readFileSync(
  fileURLToPath(new URL('../samples/resume.sample.tex', import.meta.url)),
  'utf8',
)

describe('parse', () => {
  it('finds every resumeItem bullet in the sample', () => {
    expect(parse(sample)).toHaveLength(10)
  })

  it('assigns sequential ids and exact source spans', () => {
    const bullets = parse(sample)
    expect(bullets.map((b) => b.id)).toEqual(
      bullets.map((_, i) => `bullet-${i}`),
    )
    for (const bullet of bullets) {
      expect(sample.slice(bullet.start, bullet.end)).toBe(bullet.text)
      expect(bullet.text.length).toBeGreaterThan(0)
    }
  })

  it('handles nested braces inside a bullet', () => {
    const text = 'Built \\textbf{React} and \\emph{TypeScript} with {nested} braces.'
    const bullets = parse(`prefix \\resumeItem{${text}} suffix`)
    expect(bullets).toHaveLength(1)
    expect(bullets[0]?.text).toBe(text)
  })

  it('does not treat escaped braces as nesting', () => {
    const text = 'Use \\{ and \\} as literals.'
    const bullets = parse(`\\resumeItem{${text}}`)
    expect(bullets[0]?.text).toBe(text)
  })

  it('finds the technical skills lines', () => {
    const skills = parseSkills(sample)
    expect(skills).toHaveLength(4)
    expect(skills.map((s) => s.id)).toEqual([
      'skill-0',
      'skill-1',
      'skill-2',
      'skill-3',
    ])
    for (const skill of skills) {
      expect(sample.slice(skill.start, skill.end)).toBe(skill.text)
      expect(skill.text.startsWith('\\textbf{')).toBe(true)
    }
    expect(skills[0]?.text).toContain('TypeScript')
    expect(skills[1]?.text).toContain('React')
  })
})
