import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { GeminiProvider } from '../src/lib/llm/gemini'

const schema = z.object({ proposed: z.string() })
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

function geminiResponse(text: string, status = 200): Response {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function args(call: number): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls[call]!
  return { url: String(url), init: init as RequestInit }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GeminiProvider', () => {
  it('requests structured JSON with server-side key and model', async () => {
    fetchMock.mockResolvedValue(geminiResponse('{"proposed":"Used React."}'))
    const provider = new GeminiProvider('test-key', 'gemini-test')

    expect(await provider.generateJson({ system: 'SYS', user: 'USER', schema })).toEqual({
      proposed: 'Used React.',
    })

    const { url, init } = args(0)
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent',
    )
    expect(init.headers).toMatchObject({ 'x-goog-api-key': 'test-key' })
    const body = JSON.parse(String(init.body))
    expect(body.generationConfig.responseMimeType).toBe('application/json')
    expect(body.generationConfig.responseJsonSchema.$schema).toBeUndefined()
    expect(body.generationConfig.responseJsonSchema.properties.proposed.type).toBe('string')
    expect(body.systemInstruction.parts[0].text).toBe('SYS')
    expect(body.contents[0].parts[0].text).toBe('USER')
  })

  it('retries once after Zod validation fails', async () => {
    fetchMock
      .mockResolvedValueOnce(geminiResponse('{"proposed":7}'))
      .mockResolvedValueOnce(geminiResponse('{"proposed":"Used React."}'))

    const result = await new GeminiProvider('test-key').generateJson({
      system: 'SYS',
      user: 'USER',
      schema,
    })

    expect(result).toEqual({ proposed: 'Used React.' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const second = JSON.parse(String(args(1).init.body))
    expect(second.contents[0].parts[0].text).toContain('previous response was invalid')
  })

  it('throws after two invalid responses', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(geminiResponse('{"proposed":7}')))
    await expect(
      new GeminiProvider('test-key').generateJson({ system: 'SYS', user: 'USER', schema }),
    ).rejects.toThrow('after one retry')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('fails before fetch when the key is missing', async () => {
    await expect(
      new GeminiProvider('').generateJson({ system: 'SYS', user: 'USER', schema }),
    ).rejects.toThrow('GEMINI_API_KEY is missing')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws a clear error for non-ok responses', async () => {
    fetchMock.mockResolvedValue(geminiResponse('{}', 401))
    await expect(
      new GeminiProvider('test-key').generateJson({ system: 'SYS', user: 'USER', schema }),
    ).rejects.toThrow('Gemini request failed (401)')
  })
})
