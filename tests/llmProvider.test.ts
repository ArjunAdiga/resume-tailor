import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ gemini: vi.fn(), ollama: vi.fn() }))
vi.mock('../src/lib/llm/gemini', () => ({ GeminiProvider: mocks.gemini }))
vi.mock('../src/lib/llm/ollama', () => ({ OllamaProvider: mocks.ollama }))

import { getProvider } from '../src/lib/llm'

const originalProvider = process.env.LLM_PROVIDER
const originalVercel = process.env.VERCEL
const originalAppMode = process.env.APP_MODE

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.LLM_PROVIDER
  delete process.env.VERCEL
  delete process.env.APP_MODE
  mocks.gemini.mockImplementation(() => ({ kind: 'gemini' }))
  mocks.ollama.mockImplementation(() => ({ kind: 'ollama' }))
})

afterEach(() => {
  if (originalProvider === undefined) delete process.env.LLM_PROVIDER
  else process.env.LLM_PROVIDER = originalProvider
  if (originalVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = originalVercel
  if (originalAppMode === undefined) delete process.env.APP_MODE
  else process.env.APP_MODE = originalAppMode
})

describe('provider selection', () => {
  it('uses Gemini when explicitly configured', () => {
    process.env.LLM_PROVIDER = 'gemini'
    expect(getProvider()).toEqual({ kind: 'gemini' })
    expect(mocks.gemini).toHaveBeenCalledTimes(1)
  })

  it('uses Ollama when explicitly configured', () => {
    process.env.LLM_PROVIDER = 'ollama'
    expect(getProvider()).toEqual({ kind: 'ollama' })
    expect(mocks.ollama).toHaveBeenCalledTimes(1)
  })

  it('defaults to Gemini in demo mode', () => {
    process.env.APP_MODE = 'demo'
    expect(getProvider()).toEqual({ kind: 'gemini' })
  })

  it('defaults to Ollama in personal mode', () => {
    expect(getProvider()).toEqual({ kind: 'ollama' })
  })
})
