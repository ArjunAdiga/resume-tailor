import { parseSkills } from './latex/parse'
import { normalize } from './score'

type Edit = { start: number; end: number; text: string }

export function reorderSkills(tex: string, jdKeywords: string[]): string {
  const keywords = jdKeywords.map(normalize).filter((keyword) => keyword.length > 0)
  if (keywords.length === 0) return tex

  const relevant = (item: string): boolean => {
    const value = normalize(item)
    return keywords.some((keyword) => value.includes(keyword))
  }

  const edits: Edit[] = []
  for (const skill of parseSkills(tex)) {
    const marker = '{: '
    const open = skill.text.indexOf(marker)
    if (open === -1) continue
    const itemsStart = open + marker.length
    const close = skill.text.lastIndexOf('}')
    if (close <= itemsStart) continue

    const prefix = skill.text.slice(0, itemsStart)
    const items = skill.text.slice(itemsStart, close).split(',').map((item) => item.trim())
    const suffix = skill.text.slice(close)
    const ordered = [...items].sort((a, b) => Number(relevant(b)) - Number(relevant(a)))
    const text = prefix + ordered.join(', ') + suffix
    if (text !== skill.text) {
      edits.push({ start: skill.start, end: skill.end, text })
    }
  }

  let result = tex
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end)
  }
  return result
}
