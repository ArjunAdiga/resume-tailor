import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { APPLICATION_STATUSES, type ApplicationSummary } from './uiTypes'

export const STATUSES = APPLICATION_STATUSES
export type ApplicationStatus = (typeof STATUSES)[number]

export const APPLICATION_FILES = [
  'resume.tailored.tex', 'resume.tailored.pdf', 'jd.txt', 'report.json', 'meta.json',
] as const
export type ApplicationFile = (typeof APPLICATION_FILES)[number]

export type ApplicationMeta = {
  company: string
  role: string
  url: string
  date: string
  status: ApplicationStatus
}

export type ApplicationReport = {
  before: number
  after: number
  [key: string]: unknown
}

export type SaveApplicationInput = {
  company: string
  role: string
  url: string
  jd: string
  tex: string
  report: ApplicationReport
  date?: string
  status?: ApplicationStatus
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const FOLDER = /^\d{4}-\d{2}-\d{2}_[a-z0-9-]+_[a-z0-9-]+(?:-\d+)?$/

export function slug(value: string): string {
  if (value.includes('/') || value.includes('\\') || value.includes('..')) {
    throw new Error('Invalid slug component')
  }
  const result = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  if (result.length === 0) throw new Error('Invalid slug component')
  return result
}

export function isApplicationFolder(folder: string): boolean {
  return FOLDER.test(folder) && !folder.includes('..') && !folder.includes('/') && !folder.includes('\\')
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown
  } catch {
    return null
  }
}

export function saveApplication(
  input: SaveApplicationInput,
  root = process.cwd(),
): ApplicationMeta {
  const date = input.date ?? new Date().toISOString().slice(0, 10)
  const status = input.status ?? 'saved'
  if (!DATE.test(date) || !STATUSES.includes(status)) throw new Error('Invalid application data')

  const base = `${date}_${slug(input.company)}_${slug(input.role)}`
  const dir = join(root, 'private', 'applications')
  mkdirSync(dir, { recursive: true })
  let folder = base
  for (let n = 2; existsSync(join(dir, folder)); n++) folder = `${base}-${n}`
  const target = join(dir, folder)
  mkdirSync(target, { recursive: true })

  const meta: ApplicationMeta = {
    company: input.company,
    role: input.role,
    url: input.url,
    date,
    status,
  }
  writeFileSync(join(target, 'resume.tailored.tex'), input.tex, 'utf8')
  writeFileSync(join(target, 'jd.txt'), input.jd, 'utf8')
  writeFileSync(join(target, 'report.json'), JSON.stringify(input.report, null, 2), 'utf8')
  writeFileSync(join(target, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8')
  return meta
}

export function listApplications(root = process.cwd()): ApplicationSummary[] {
  const dir = join(root, 'private', 'applications')
  if (!existsSync(dir)) return []
  const items: ApplicationSummary[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !isApplicationFolder(entry.name)) continue
    const meta = readJson(join(dir, entry.name, 'meta.json')) as ApplicationMeta | null
    const report = readJson(join(dir, entry.name, 'report.json')) as ApplicationReport | null
    if (!meta || !report) continue
    items.push({
      ...meta,
      folder: entry.name,
      scoreBefore: report.before,
      scoreAfter: report.after,
    })
  }
  return items.sort((a, b) => b.date.localeCompare(a.date) || b.folder.localeCompare(a.folder))
}

export function updateApplicationStatus(
  folder: string,
  status: ApplicationStatus,
  root = process.cwd(),
): boolean {
  if (!isApplicationFolder(folder) || !STATUSES.includes(status)) return false
  const path = join(root, 'private', 'applications', folder, 'meta.json')
  const meta = readJson(path) as ApplicationMeta | null
  if (!meta) return false
  writeFileSync(path, JSON.stringify({ ...meta, status }, null, 2), 'utf8')
  return true
}

export function readApplicationFile(
  folder: string,
  file: string,
  root = process.cwd(),
): { content: string; contentType: string } | null {
  if (!isApplicationFolder(folder) || !APPLICATION_FILES.includes(file as ApplicationFile)) return null
  const path = join(root, 'private', 'applications', folder, file)
  if (!existsSync(path)) return null
  return {
    content: readFileSync(path, 'utf8'),
    contentType: file.endsWith('.json') ? 'application/json' : 'text/plain',
  }
}

export function readApplicationBinary(folder: string, file: string, root = process.cwd()): Buffer | null {
  if (!isApplicationFolder(folder) || file !== 'resume.tailored.pdf') return null
  const path = join(root, 'private', 'applications', folder, file)
  return existsSync(path) ? readFileSync(path) : null
}
