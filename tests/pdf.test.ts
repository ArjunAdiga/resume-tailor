import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { execFileMock } = vi.hoisted(() => ({ execFileMock: vi.fn() }))
vi.mock('node:child_process', () => ({
  execFile: (...args: unknown[]) => execFileMock(...args),
}))

import { compileApplicationPdf, countBasePages, lastLines, tectonicAvailable } from '../src/lib/pdf'

type Options = { cwd: string; timeout: number }
type Callback = (error: Error | null, stdout: string, stderr: string) => void
type Result = { error?: Error; stdout?: string; stderr?: string; writePdf?: string }

function mockExecFile(handler: (args: string[], options: Options) => Result): void {
  execFileMock.mockImplementation((
    command: string,
    args: string[],
    options: Options,
    callback: Callback,
  ) => {
    expect(command).toBe('tectonic')
    const result = handler(args, options)
    if (result.writePdf) writeFileSync(join(options.cwd, 'resume.tailored.pdf'), result.writePdf)
    callback(result.error ?? null, result.stdout ?? '', result.stderr ?? '')
  })
}

function success(): Result {
  return {}
}

function versionOnly(args: string[]): Result | undefined {
  if (args[0] === '--version') return success()
  return undefined
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('pdf', () => {
  it('compiles with fixed args and counts pages without matching /Pages', async () => {
    const root = mkdtempSync(join(tmpdir(), 'pdf-test-'))
    const folder = '2026-01-02_acme-dev_engineer'
    mkdirSync(join(root, 'private', 'applications', folder), { recursive: true })
    writeFileSync(
      join(root, 'private', 'applications', folder, 'resume.tailored.pdf'),
      '/Type /Pages\n/Type /Page\n/Type /Page\n',
    )
    mockExecFile((args) => versionOnly(args) ?? success())

    const result = await compileApplicationPdf(folder, root)

    expect(result).toMatchObject({ ok: true, pages: 2 })
    expect(execFileMock).toHaveBeenCalledWith(
      'tectonic',
      ['-X', 'compile', 'resume.tailored.tex'],
      { cwd: join(root, 'private', 'applications', folder), timeout: 90000 },
      expect.any(Function),
    )
  })

  it('reports a missing Tectonic install without compiling', async () => {
    mockExecFile(() => ({ error: Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }) }))

    const result = await compileApplicationPdf('2026-01-02_acme-dev_engineer')

    expect(result).toEqual({ ok: false, error: 'Tectonic is not installed.', log: [], missing: true })
    expect(execFileMock).toHaveBeenCalledTimes(1)
  })

  it('returns only the last 20 log lines on failure', async () => {
    const lines = Array.from({ length: 25 }, (_, index) => `line-${index + 1}`).join('\n')
    mockExecFile((args) => versionOnly(args) ?? { error: new Error('compile failed'), stderr: lines })

    const result = await compileApplicationPdf('2026-01-02_acme-dev_engineer')

    expect(result.ok).toBe(false)
    expect(result.log).toHaveLength(20)
    expect(result.log[0]).toBe('line-6')
    expect(result.log[19]).toBe('line-25')
  })

  it('counts base resume pages from a temporary compile', async () => {
    const root = mkdtempSync(join(tmpdir(), 'pdf-base-test-'))
    mkdirSync(join(root, 'private'), { recursive: true })
    writeFileSync(join(root, 'private', 'base.tex'), '\\documentclass{article}')
    mockExecFile((args) => versionOnly(args) ?? { writePdf: '/Type /Page\n' })

    expect(await countBasePages(root)).toBe(1)
    expect(execFileMock).toHaveBeenCalledWith(
      'tectonic',
      ['-X', 'compile', 'resume.tailored.tex'],
      { cwd: expect.stringContaining('resume-tailor-base-'), timeout: 90000 },
      expect.any(Function),
    )
  })

  it('detects availability from a version check', async () => {
    mockExecFile(success)
    expect(await tectonicAvailable()).toBe(true)
    expect(execFileMock).toHaveBeenCalledWith(
      'tectonic', ['--version'], { cwd: process.cwd(), timeout: 5000 }, expect.any(Function),
    )
  })

  it('keeps only non-empty trailing log lines', () => {
    expect(lastLines('a\n\nb\n')).toEqual(['a', 'b'])
  })
})
