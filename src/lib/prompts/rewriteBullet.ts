export const rewriteBulletSystem = [
  'You rephrase one resume bullet to better match a job description.',
  'Rephrase only. Add no new facts, skills, tools, employers, numbers, or metrics.',
  'Keep the original meaning and a similar length.',
  'Return only the requested JSON.',
].join(' ')

export function rewriteBulletUser(opts: {
  bullet: string
  resumeText: string
  matchedKeywords: string[]
  reasons?: string[]
}): string {
  const parts = [
    'Resume bullet:',
    opts.bullet,
    '',
    'Matched keywords already present in the resume:',
    opts.matchedKeywords.join(', ') || '(none)',
    '',
    'Full resume text:',
    opts.resumeText,
    '',
    'Rewrite the bullet using only the facts above.',
  ]
  if (opts.reasons && opts.reasons.length > 0) {
    parts.push('', 'Your previous rewrite was rejected for these reasons:', ...opts.reasons)
  }
  return parts.join('\n')
}
