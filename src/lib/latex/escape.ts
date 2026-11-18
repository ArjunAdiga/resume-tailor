const ESCAPES: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
}

const SPECIAL = /[\\&%$#_{}~^]/g

export function escape(text: string): string {
  return text.replace(SPECIAL, (char) => ESCAPES[char] ?? char)
}
