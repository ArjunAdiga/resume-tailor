import { z } from 'zod'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OllamaProvider } from '../src/lib/llm/ollama'

const schema = z.object({ text: z.string() })
const opts = { system: 'system prompt', user: 'user prompt', schema }

function reply(content: string): Response {
  return new Response(JSON.stringify({ message: { content } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('OllamaProvider', () => {
  it('validates a successful response and sends the expected options', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply('{"text":"ok"}'))
    vi.stubGlobal('fetch', fetchMock)
    const llm = new OllamaProvider('http://localhost:11434', 'qwen3:4b')

    await expect(llm.generateJson(opts)).resolves.toEqual({ text: 'ok' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('http://localhost:11434/api/chat')
    const body = JSON.parse(String(init?.body))
    expect(body).toMatchObject({
      model: 'qwen3:4b',
      stream: false,
      think: false,
      options: { temperature: 0.1, num_ctx: 8192 },
    })
    expect(body.format.type).toBe('object')
  })

  it('retries once with the validation error appended', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply('{"wrong":true}'))
      .mockResolvedValueOnce(reply('{"text":"fixed"}'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await new OllamaProvider().generateJson(opts)
    expect(result).toEqual({ text: 'fixed' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const second = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))
    expect(second.messages[1].content).toContain('user prompt')
    expect(second.messages[1].content).toMatch(/invalid|required|expected/i)
  })

  it('throws a clear error when every response is invalid', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(reply('{"wrong":true}')))
    vi.stubGlobal('fetch', fetchMock)

    await expect(new OllamaProvider().generateJson(opts)).rejects.toThrow(
      /did not return valid JSON after one retry/,
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('explains how to fix an unreachable Ollama server', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))

    await expect(new OllamaProvider().generateJson(opts)).rejects.toThrow(
      /ollama serve/,
    )
  })
})
