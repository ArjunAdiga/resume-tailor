import type { ResumeSource } from './resume/source'

export const APPLICATION_STATUSES = ['saved', 'applied', 'interview', 'rejected', 'offer'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export type ApplicationSummary = {
  company: string
  role: string
  url: string
  date: string
  status: ApplicationStatus
  folder: string
  scoreBefore: number
  scoreAfter: number
}

export type Bullet = { id: string; text: string }

export type Analysis = {
  score: number
  present: string[]
  missing: string[]
  roleTitle: string
  requiredSkills: string[]
  niceToHaveSkills: string[]
  bullets: Bullet[]
  source: ResumeSource
}

export type Change = {
  id: string
  original: string
  proposed: string
  status: 'rewritten' | 'kept'
  reasons: string[]
  decision: 'pending' | 'accepted' | 'rejected'
}
