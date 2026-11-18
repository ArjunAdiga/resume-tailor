import { getMode } from '../mode'
import { GeminiProvider } from './gemini'
import { OllamaProvider } from './ollama'
import type { LLMProvider } from './provider'

export function getProvider(): LLMProvider {
  const configured = process.env.LLM_PROVIDER
  const name = configured === 'ollama' || configured === 'gemini'
    ? configured
    : getMode() === 'demo' ? 'gemini' : 'ollama'
  return name === 'gemini' ? new GeminiProvider() : new OllamaProvider()
}
