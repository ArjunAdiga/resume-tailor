import { OllamaProvider } from './ollama'
import type { LLMProvider } from './provider'

export function getProvider(): LLMProvider {
  return new OllamaProvider()
}
