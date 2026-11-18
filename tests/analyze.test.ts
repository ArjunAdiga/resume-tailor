import { existsSync, readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../src/app/api/analyze/route'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

vi.mock('../src/lib/llm/index', async () => {
  const { FakeProvider } = await import('../src/lib/llm/fake')
  return {
    getProvider: () =>
      new FakeProvider([
        {
          roleTitle: 'Frontend Engineer',
          requiredSkills: ['React'],
          niceToHaveSkills: ['Vitest'],
          keywords: ['React', 'Vitest'],
        },
      ]),
  }
})

const originalVercel = process.env.VERCEL
const originalAppMode = process.env.APP_MODE

function analyze(body: unknown): Request {
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.VERCEL
  delete process.env.APP_MODE
  vi.mocked(existsSync).mockReturnValue(false)
  vi.mocked(readFileSync).mockReturnValue(
    '\\resumeItem{Built React with Vitest in 2024.}',
  )
})

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = originalVercel
  if (originalAppMode === undefined) delete process.env.APP_MODE
  else process.env.APP_MODE = originalAppMode
})

describe('analyze route', () => {
  it('analyzes the sample resume and returns the source', async () => {
    const response = await POST(analyze({ jd: 'We use React and Vitest.' }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.source).toBe('sample')
    expect(body.roleTitle).toBe('Frontend Engineer')
    expect(body.present).toEqual(['React', 'Vitest'])
    expect(body.missing).toEqual([])
    expect(body.score).toBe(100)
    expect(body.bullets).toHaveLength(1)
  })

  it('prefers uploaded text and reports missing keywords', async () => {
    const response = await POST(
      analyze({ jd: 'We use React and Vitest.', tex: '\\resumeItem{Used React in 2024.}' }),
    )
    const body = await response.json()
    expect(body.source).toBe('uploaded')
    expect(body.missing).toEqual(['Vitest'])
    expect(body.score).toBe(80)
    expect(readFileSync).not.toHaveBeenCalled()
  })

  it('validates the request body', async () => {
    const response = await POST(analyze({ tex: 'x' }))
    expect(response.status).toBe(400)
  })
})
