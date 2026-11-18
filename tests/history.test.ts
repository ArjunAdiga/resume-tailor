import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  listApplications,
  readApplicationFile,
  saveApplication,
  slug,
  updateApplicationStatus,
} from '../src/lib/history'

let root: string

const input = {
  company: 'Acme Corp',
  role: 'Frontend Engineer',
  url: 'https://example.com/job',
  jd: 'Fake JD',
  tex: '\\resumeItem{Built React apps.}',
  report: { before: 50, after: 80 },
  date: '2026-01-02',
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'history-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('slug', () => {
  it('keeps only lowercase letters, digits and hyphens', () => {
    expect(slug('Hello, World!')).toBe('hello-world')
    expect(slug('C++ Engineer')).toBe('c-engineer')
  })

  it('rejects path traversal and empty values', () => {
    expect(() => slug('../../etc/passwd')).toThrow()
    expect(() => slug('a\\b')).toThrow()
    expect(() => slug('!!!')).toThrow()
  })
})

describe('saveApplication', () => {
  it('writes all four files with the expected metadata', () => {
    const meta = saveApplication(input, root)
    expect(meta).toEqual({
      company: 'Acme Corp',
      role: 'Frontend Engineer',
      url: input.url,
      date: '2026-01-02',
      status: 'saved',
    })
    const folder = join(root, 'private', 'applications', '2026-01-02_acme-corp_frontend-engineer')
    for (const file of ['resume.tailored.tex', 'jd.txt', 'report.json', 'meta.json']) {
      expect(existsSync(join(folder, file))).toBe(true)
    }
    expect(readFileSync(join(folder, 'meta.json'), 'utf8')).toContain('Acme Corp')
  })

  it('adds -2 and -3 for duplicate folders', () => {
    saveApplication(input, root)
    saveApplication(input, root)
    saveApplication(input, root)
    const dir = join(root, 'private', 'applications')
    expect(existsSync(join(dir, '2026-01-02_acme-corp_frontend-engineer-2'))).toBe(true)
    expect(existsSync(join(dir, '2026-01-02_acme-corp_frontend-engineer-3'))).toBe(true)
  })

  it('rejects an unsupported status', () => {
    expect(() => saveApplication({ ...input, status: 'hired' as never }, root)).toThrow()
  })
})

describe('application records', () => {
  const folder = '2026-01-02_acme-corp_frontend-engineer'

  it('lists records with before and after scores', () => {
    saveApplication(input, root)
    saveApplication({ ...input, date: '2026-03-04', company: 'Beta Inc' }, root)
    const records = listApplications(root)
    expect(records).toHaveLength(2)
    expect(records[0]).toMatchObject({ date: '2026-03-04', scoreBefore: 50, scoreAfter: 80 })
  })

  it('updates status for a valid folder only', () => {
    saveApplication(input, root)
    expect(updateApplicationStatus(folder, 'interview', root)).toBe(true)
    expect(listApplications(root)[0]?.status).toBe('interview')
    expect(updateApplicationStatus('../../etc', 'offer', root)).toBe(false)
  })

  it('reads allowlisted files only', () => {
    saveApplication(input, root)
    expect(readApplicationFile(folder, 'jd.txt', root)?.content).toBe('Fake JD')
    expect(readApplicationFile(folder, '../../etc/passwd', root)).toBeNull()
  })
})
