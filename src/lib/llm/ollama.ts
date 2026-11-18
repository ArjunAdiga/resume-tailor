import { z } from 'zod'
import type { LLMProvider } from './provider'

type GenerateOpts<T> = {
  system: string
  user: string
  schema: z.ZodType<T>
}

function parseContent(content: string): unknown {
  const candidates = [content]
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start !== -1 && end > start) {
    candidates.push(content.slice(start, end + 1))
  }
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      continue
    }
  }
  throw new Error('Ollama response was not valid JSON')
}

export class OllamaProvider implements LLMProvider {
  constructor(
    private readonly baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    private readonly model = process.env.OLLAMA_MODEL ?? 'qwen3:4b',
  ) {}

  async generateJson<T>(opts: GenerateOpts<T>): Promise<T> {
    let user = opts.user
    let lastError = 'unknown validation error'

    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await this.call(opts.system, user, opts.schema)
      const result = opts.schema.safeParse(raw)
      if (result.success) return result.data
      lastError = result.error.message
      user = `${opts.user}\n\nYour previous response was invalid. Fix this error: ${lastError}`
    }

    throw new Error(`Ollama did not return valid JSON after one retry: ${lastError}`)
  }

  private async call<T>(system: string, user: string, schema: z.ZodType<T>): Promise<unknown> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          think: false,
          format: z.toJSONSchema(schema),
          options: { temperature: 0.1, num_ctx: 8192 },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      })
    } catch (cause) {
      throw new Error(
        `Cannot reach Ollama at ${this.baseUrl}. Start it with "ollama serve" and check OLLAMA_BASE_URL.`,
        { cause },
      )
    }

    if (!response.ok) {
      throw new Error(
        `Ollama request failed (${response.status}). Check that "${this.model}" is installed with "ollama pull ${this.model}".`,
      )
    }

    const data = (await response.json()) as { message?: { content?: string } }
    if (typeof data.message?.content !== 'string') {
      throw new Error('Ollama response did not contain message.content.')
    }
    return parseContent(data.message.content)
  }
}
