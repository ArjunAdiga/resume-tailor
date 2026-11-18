import { describe, expect, it } from 'vitest'
import { reorderSkills } from '../src/lib/skills'

const tex = [
  '\\section{Technical Skills}',
  '\\textbf{Languages}{: TypeScript, JavaScript, HTML, CSS} \\\\',
  '\\textbf{Tools}{: Git, Figma, Vitest}',
].join('\n')

describe('reorderSkills', () => {
  it('moves matching skills to the front without adding any', () => {
    const result = reorderSkills(tex, ['JavaScript', 'CSS'])
    expect(result).toContain('\\textbf{Languages}{: JavaScript, CSS, TypeScript, HTML} \\\\')
    expect(result).toContain('\\textbf{Tools}{: Git, Figma, Vitest}')
  })

  it('preserves the original item set', () => {
    const result = reorderSkills(tex, ['CSS'])
    const before = result.match(/CSS|TypeScript|JavaScript|HTML/g)?.sort()
    expect(before).toEqual(['CSS', 'HTML', 'JavaScript', 'TypeScript'])
  })

  it('handles aliases from the JD', () => {
    const input = '\\section{Technical Skills}\n\\textbf{Languages}{: TypeScript, JavaScript, HTML, Node.js}'
    expect(reorderSkills(input, ['js', 'node'])).toContain(
      '\\textbf{Languages}{: JavaScript, Node.js, TypeScript, HTML}',
    )
  })

  it('reorders more than one skills line', () => {
    const result = reorderSkills(tex, ['Figma', 'Vitest'])
    expect(result).toContain('\\textbf{Tools}{: Figma, Vitest, Git}')
  })

  it('leaves the text unchanged when nothing matches', () => {
    expect(reorderSkills(tex, ['Kubernetes'])).toBe(tex)
  })

  it('leaves text without a skills section unchanged', () => {
    expect(reorderSkills('\\section{Experience}', ['React'])).toBe('\\section{Experience}')
  })
})
