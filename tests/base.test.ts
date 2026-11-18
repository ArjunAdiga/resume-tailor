import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '../src/app/api/base/route'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

const originalVercel = process.env.VERCEL
const originalAppMode = process.env.APP_MODE

function post(body: unknown): Request {
  return new Request('http://localhost/api/base', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.VERCEL
  delete process.env.APP_MODE
})

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = originalVercel
  if (originalAppMode === undefined) delete process.env.APP_MODE
  else process.env.APP_MODE = originalAppMode
})

describe('base route', () => {
  it('returns 404 for GET and POST in demo mode', async () => {
    process.env.APP_MODE = 'demo'
    expect((await GET()).status).toBe(404)
    expect((await POST(post({ tex: 'x' }))).status).toBe(404)
    expect(existsSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it('reports a missing saved resume in personal mode', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const response = await GET()
    expect(await response.json()).toEqual({ exists: false, tex: '' })
  })

  it('returns the saved resume text when present', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('SAVED TEX')
    const response = await GET()
    expect(await response.json()).toEqual({ exists: true, tex: 'SAVED TEX' })
  })

  it('saves a valid POST body and creates the directory', async () => {
    const response = await POST(post({ tex: 'NEW TEX' }))
    expect(response.status).toBe(200)
    expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining('private'), {
      recursive: true,
    })
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('private/base.tex'),
      'NEW TEX',
      'utf8',
    )
  })

  it('rejects an invalid POST body', async () => {
    const response = await POST(post({ wrong: true }))
    expect(response.status).toBe(400)
    expect(writeFileSync).not.toHaveBeenCalled()
  })
})
