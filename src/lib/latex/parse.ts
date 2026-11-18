export type Span = {
  id: string
  start: number
  end: number
  text: string
}

const BULLET = '\\resumeItem'
const SKILLS = '\\section{Technical Skills}'

function closingBrace(tex: string, open: number): number {
  let depth = 0
  for (let i = open; i < tex.length; i++) {
    const char = tex[i]
    if (char === '\\') {
      i++
      continue
    }
    if (char === '{') depth++
    if (char === '}' && --depth === 0) return i
  }
  return -1
}

export function parse(tex: string): Span[] {
  const bullets: Span[] = []
  let from = 0
  while (from < tex.length) {
    const marker = tex.indexOf(BULLET, from)
    if (marker === -1) break
    const after = marker + BULLET.length
    let open = after
    while (open < tex.length && /\s/.test(tex[open] ?? '')) open++
    if (tex[open] !== '{') {
      from = after
      continue
    }
    const close = closingBrace(tex, open)
    if (close === -1) break
    bullets.push({
      id: `bullet-${bullets.length}`,
      start: open + 1,
      end: close,
      text: tex.slice(open + 1, close),
    })
    from = close + 1
  }
  return bullets
}

export function parseSkills(tex: string): Span[] {
  const section = tex.indexOf(SKILLS)
  if (section === -1) return []
  const from = section + SKILLS.length
  const next = tex.indexOf('\\section{', from)
  const to = next === -1 ? tex.length : next
  const lines: Span[] = []
  let offset = from
  for (const line of tex.slice(from, to).split('\n')) {
    const indent = line.length - line.trimStart().length
    const text = line.slice(indent)
    if (text.startsWith('\\textbf{')) {
      lines.push({
        id: `skill-${lines.length}`,
        start: offset + indent,
        end: offset + line.length,
        text,
      })
    }
    offset += line.length + 1
  }
  return lines
}
