import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeProvider } from '../src/lib/llm/fake'
import { POST } from '../src/app/api/tailor/route'

const mocks = vi.hoisted(() => ({ getProvider: vi.fn() }))
vi.mock('../src/lib/llm/index', () => ({ getProvider: mocks.getProvider }))

let provider: FakeProvider

function tailor(body: unknown): Request {
  return new Request('http://localhost/api/tailor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function request(original: string) {
  return {
    id: 'bullet-0',
    bullet: original,
    resumeText: original,
    matchedKeywords: [],
  }
}

beforeEach(() => {
  provider = new FakeProvider()
  mocks.getProvider.mockReturnValue(provider)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('tailor route', () => {
  it('returns an escaped rewrite when the guard passes', async () => {
    provider.enqueue({ proposed: 'Used Git & Figma.' })
    const response = await POST(tailor(request('Used Git and Figma.')))
    expect(await response.json()).toEqual({
      id: 'bullet-0',
      original: 'Used Git and Figma.',
      proposed: 'Used Git \\& Figma.',
      status: 'rewritten',
      reasons: [],
    })
  })

  it('retries once with the rejection reasons', async () => {
    provider.enqueue({ proposed: 'Cut load time by 40%.' })
    provider.enqueue({ proposed: 'Created reusable React components.' })
    const response = await POST(tailor(request('Built reusable React components.')))
    const body = await response.json()
    expect(body.status).toBe('rewritten')
    expect(body.proposed).toBe('Created reusable React components.')
    expect(provider.calls).toHaveLength(2)
    expect(provider.calls[1]?.user).toContain('numbers')
  })

  it('keeps the original when both attempts fail the guard', async () => {
    provider.enqueue({ proposed: 'Cut load time by 40%.' })
    provider.enqueue({ proposed: 'Used Kubernetes for the work.' })
    const response = await POST(tailor(request('Built reusable React components.')))
    const body = await response.json()
    expect(body.status).toBe('kept')
    expect(body.proposed).toBe('Built reusable React components.')
    expect(body.reasons.join(' ')).toContain('Kubernetes')
  })

  it('keeps the original when the model fails', async () => {
    const response = await POST(tailor(request('BuiltReact components.')))
    const body = await response.json()
    expect(body.status).toBe('kept')
    expect(body.reasons.join(' ')).toContain('model')
  })

  it('validates the request body', async () => {
    const response = await POST(tailor({ bullet: 'x' }))
    expect(response.status).toBe(400)
  })
})
