import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  redis: vi.fn(),
  ratelimit: vi.fn(),
  limit: vi.fn(),
  slidingWindow: vi.fn(() => ({ window: true })),
}))
vi.mock('@upstash/redis', () => ({ Redis: mocks.redis }))
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(mocks.ratelimit, { slidingWindow: mocks.slidingWindow }),
}))

import {
  checkDemoLimits,
  checkTextLimits,
  clientIp,
  countResumeBullets,
  resetLimitsForTests,
} from '../src/lib/limits'

const original = {
  appMode: process.env.APP_MODE,
  vercel: process.env.VERCEL,
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  cap: process.env.DAILY_LLM_CAP,
}

function request(ip = '1.2.3.4'): Request {
  return new Request('http://localhost/api/analyze', {
    headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` },
  })
}

function input(resume = 'short', jd = 'short jd', bullets = 1) {
  return { resume, jd, bullets }
}

async function status(resume: string, jd = 'short jd', bullets = 1) {
  const result = await checkDemoLimits(request(), input(resume, jd, bullets))
  return result.ok ? undefined : result.status
}

beforeEach(() => {
  vi.clearAllMocks()
  resetLimitsForTests()
  delete process.env.APP_MODE
  delete process.env.VERCEL
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  delete process.env.DAILY_LLM_CAP
  mocks.ratelimit.mockImplementation(() => ({ limit: mocks.limit }))
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60000 })
})

afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  resetLimitsForTests()
})

describe('demo limits', () => {
  it('returns 413 for oversized resume, JD, and bullet count', async () => {
    process.env.APP_MODE = 'demo'
    expect(await status('x'.repeat(30001))).toBe(413)
    expect(await status('x', 'y'.repeat(10001))).toBe(413)
    expect(await status('x', 'y', 41)).toBe(413)
  })

  it('returns 429 after the hourly in-memory limit', async () => {
    process.env.APP_MODE = 'demo'
    for (let index = 0; index < 60; index++) {
      expect((await checkDemoLimits(request(), input())).ok).toBe(true)
    }
    const denied = await checkDemoLimits(request(), input())
    expect(denied).toMatchObject({ ok: false, status: 429 })
    expect(denied.ok || denied.error).toContain('try again')
  })

  it('skips limits outside demo mode', async () => {
    expect((await checkDemoLimits(request(), input('x'.repeat(30001), 'y', 41))).ok).toBe(true)
  })

  it('uses Upstash when configured', async () => {
    process.env.APP_MODE = 'demo'
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token'
    resetLimitsForTests()

    expect((await checkDemoLimits(request(), input())).ok).toBe(true)
    expect(mocks.redis).toHaveBeenCalledWith({
      url: 'https://example.upstash.io',
      token: 'token',
    })
    expect(mocks.limit).toHaveBeenCalledTimes(2)
  })

  it('extracts IP and counts resume bullets', () => {
    expect(clientIp(request())).toBe('1.2.3.4')
    expect(countResumeBullets('\\resumeItem{A}\\resumeItem{B}')).toBe(2)
    expect(checkTextLimits('x', 'y', 1)).toEqual({ ok: true })
  })
})
