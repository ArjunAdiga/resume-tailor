import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getMode } from '../mode'

export type ResumeSource = 'uploaded' | 'saved' | 'sample'

export type ResolvedResume = {
  tex: string
  source: ResumeSource
}

export function resolveResume(input?: string): ResolvedResume {
  if (input !== undefined && input.trim().length > 0) {
    return { tex: input, source: 'uploaded' }
  }

  const root = process.cwd()
  if (getMode() === 'personal') {
    const saved = join(root, 'private', 'base.tex')
    if (existsSync(saved)) {
      return { tex: readFileSync(saved, 'utf8'), source: 'saved' }
    }
  }

  return {
    tex: readFileSync(join(root, 'samples', 'resume.sample.tex'), 'utf8'),
    source: 'sample',
  }
}
