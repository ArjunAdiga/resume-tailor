import { existsSync, readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveResume } from '../src/lib/resume/source'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

const originalVercel = process.env.VERCEL
const originalAppMode = process.env.APP_MODE

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.VERCEL
  delete process.env.APP_MODE
  vi.mocked(readFileSync).mockImplementation((file) =>
    String(file).includes('private') ? 'SAVED TEX' : 'SAMPLE TEX',
  )
})

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = originalVercel
  if (originalAppMode === undefined) delete process.env.APP_MODE
  else process.env.APP_MODE = originalAppMode
})

describe('resolveResume', () => {
  it('prefers non-empty uploaded text and does not touch the filesystem', () => {
    expect(resolveResume('  \\resumeItem{Hello}  ')).toEqual({
      tex: '  \\resumeItem{Hello}  ',
      source: 'uploaded',
    })
    expect(readFileSync).not.toHaveBeenCalled()
  })

  it('treats blank input as no input', () => {
    vi.mocked(existsSync).mockReturnValue(false)
    expect(resolveResume('   ')).toEqual({ tex: 'SAMPLE TEX', source: 'sample' })
  })

  it('uses private/base.tex in personal mode when it exists', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    expect(resolveResume()).toEqual({ tex: 'SAVED TEX', source: 'saved' })
    expect(readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('private/base.tex'),
      'utf8',
    )
  })

  it('falls back to the sample in personal mode', () => {
    vi.mocked(existsSync).mockReturnValue(false)
    expect(resolveResume()).toEqual({ tex: 'SAMPLE TEX', source: 'sample' })
    expect(readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('samples/resume.sample.tex'),
      'utf8',
    )
  })

  it('never checks private/base.tex in demo mode', () => {
    process.env.VERCEL = '1'
    expect(resolveResume()).toEqual({ tex: 'SAMPLE TEX', source: 'sample' })
    expect(existsSync).not.toHaveBeenCalled()
    expect(readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('samples/resume.sample.tex'),
      'utf8',
    )
  })
})
