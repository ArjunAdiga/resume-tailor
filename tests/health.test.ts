import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../src/app/api/health/route'

const originalBase = process.env.OLLAMA_BASE_URL
const originalModel = process.env.OLLAMA_MODEL

function tagsResponse(names: string[]): Response {
  return new Response(JSON.stringify({ models: names.map((name) => ({ name })) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  process.env.OLLAMA_BASE_URL = 'http://localhost:11434'
  process.env.OLLAMA_MODEL = 'qwen3:4b'
})

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalBase === undefined) delete process.env.OLLAMA_BASE_URL
  else process.env.OLLAMA_BASE_URL = originalBase
  if (originalModel === undefined) delete process.env.OLLAMA_MODEL
  else process.env.OLLAMA_MODEL = originalModel
})

describe('health route', () => {
  it('reports success when Ollama and the model are available', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tagsResponse(['qwen3:4b', 'llama3:8b']))
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET()
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body).toMatchObject({ ok: true, model: 'qwen3:4b' })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:11434/api/tags')
  })

  it('gives a fix hint when Ollama is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))

    const response = await GET()
    const body = await response.json()
    expect(response.status).toBe(503)
    expect(body.ok).toBe(false)
    expect(body.hint).toContain('ollama serve')
  })

  it('tells the user to pull a missing model', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tagsResponse(['llama3:8b'])))

    const response = await GET()
    const body = await response.json()
    expect(response.status).toBe(503)
    expect(body.message).toContain('qwen3:4b')
    expect(body.hint).toContain('ollama pull qwen3:4b')
  })
})
