import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as analyze } from '../src/app/api/analyze/route'
import { POST as tailor } from '../src/app/api/tailor/route'

const mocks = vi.hoisted(() => ({
  checkDemoLimits: vi.fn(),
  countResumeBullets: vi.fn(() => 1),
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))
vi.mock('../src/lib/limits', () => ({
  checkDemoLimits: mocks.checkDemoLimits,
  countResumeBullets: mocks.countResumeBullets,
}))
vi.mock('node:fs', () => ({ existsSync: mocks.existsSync, readFileSync: mocks.readFileSync }))

const originalAppMode = process.env.APP_MODE
const originalVercel = process.env.VERCEL

function request(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.APP_MODE = 'demo'
  delete process.env.VERCEL
  vi.spyOn(console, 'log').mockImplementation(() => {})
  mocks.existsSync.mockReturnValue(false)
  mocks.readFileSync.mockReturnValue('\\resumeItem{Used React in 2024.}')
})

afterEach(() => {
  if (originalAppMode === undefined) delete process.env.APP_MODE
  else process.env.APP_MODE = originalAppMode
  if (originalVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = originalVercel
  vi.restoreAllMocks()
})

function loggedFields(): string[] {
  const line = vi.mocked(console.log).mock.calls[0]![0] as string
  return Object.keys(JSON.parse(line)).sort()
}

describe('demo route limits', () => {
  it('returns 413 from analyze with a clear message', async () => {
    mocks.checkDemoLimits.mockResolvedValue({ ok: false, status: 413, error: 'Resume too long.' })
    const response = await analyze(request('/api/analyze', { jd: 'JD' }))
    expect(response.status).toBe(413)
    expect(await response.json()).toEqual({ error: 'Resume too long.' })
    expect(loggedFields()).toEqual(['ms', 'status'])
  })

  it('returns 429 from analyze', async () => {
    mocks.checkDemoLimits.mockResolvedValue({ ok: false, status: 429, error: 'Try later.' })
    const response = await analyze(request('/api/analyze', { jd: 'JD' }))
    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ error: 'Try later.' })
  })

  it('returns 429 from tailor', async () => {
    mocks.checkDemoLimits.mockResolvedValue({ ok: false, status: 429, error: 'Try later.' })
    const response = await tailor(request('/api/tailor', {
      id: 'bullet-0',
      bullet: 'Used React.',
      resumeText: 'Used React.',
      matchedKeywords: [],
    }))
    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ error: 'Try later.' })
  })
})
