export const extractJdSystem =
  'You extract requirements from a job description. Use only what is written in the job description. Never guess, infer, or add skills, tools, employers, or numbers that are not stated. Return only the requested JSON.'

export function extractJdUser(jd: string): string {
  return [
    'Job description:',
    jd,
    '',
    'Extract the role title, required skills, nice-to-have skills, and keywords.',
    'Include only items explicitly written in the job description. Do not guess.',
  ].join('\n')
}
