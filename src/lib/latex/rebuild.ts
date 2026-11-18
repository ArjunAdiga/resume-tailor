import { parse } from './parse'

export type Replacement = {
  id: string
  newText: string
}

export function rebuild(tex: string, replacements: Replacement[]): string {
  if (replacements.length === 0) return tex
  const byId = new Map(replacements.map((r) => [r.id, r.newText]))
  const edits = parse(tex)
    .filter((span) => byId.has(span.id))
    .map((span) => ({
      start: span.start,
      end: span.end,
      newText: byId.get(span.id) ?? '',
    }))
    .sort((a, b) => b.start - a.start)

  let result = tex
  for (const edit of edits) {
    result = result.slice(0, edit.start) + edit.newText + result.slice(edit.end)
  }
  return result
}
