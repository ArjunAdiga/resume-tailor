import { z } from 'zod'
import type { LLMProvider } from './provider'

type GenerateOpts<T> = {
  system: string
  user: string
  schema: z.ZodType<T>
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

function parseContent(content: string): unknown {
  const candidates = [content]
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start !== -1 && end > start) candidates.push(content.slice(start, end + 1))
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      continue
    }
  }
  throw new Error('Gemini response was not valid JSON')
}

function jsonSchema<T>(schema: z.ZodType<T>): Record<string, unknown> {
  const value = z.toJSONSchema(schema) as Record<string, unknown>
  delete value.$schema
  return value
}

export class GeminiProvider implements LLMProvider {
  constructor(
    private readonly apiKey = process.env.GEMINI_API_KEY,
    private readonly model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  ) {
    if (typeof window !== 'undefined') {
      throw new Error('GeminiProvider is server-side only.')
    }
  }

  async generateJson<T>(opts: GenerateOpts<T>): Promise<T> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is missing. Set it on the server.')
    let user = opts.user
    let lastError = 'unknown validation error'

    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await this.call(opts.system, user, opts.schema, this.apiKey)
      const result = opts.schema.safeParse(raw)
      if (result.success) return result.data
      lastError = result.error.message
      user = `${opts.user}\n\nYour previous response was invalid. Fix this error: ${lastError}`
    }

    throw new Error(`Gemini did not return valid JSON after one retry: ${lastError}`)
  }

  private async call<T>(
    system: string,
    user: string,
    schema: z.ZodType<T>,
    apiKey: string,
  ): Promise<unknown> {
    const model = encodeURIComponent(this.model)
    let response: Response
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              responseJsonSchema: jsonSchema(schema),
              temperature: 0.1,
            },
          }),
        },
      )
    } catch (cause) {
      throw new Error('Cannot reach the Gemini API. Check network access and try again.', { cause })
    }

    if (!response.ok) {
      throw new Error(
        `Gemini request failed (${response.status}). Check GEMINI_API_KEY and GEMINI_MODEL.`,
      )
    }

    const data = (await response.json()) as GeminiResponse
    const text = data.candidates?.[0]?.content?.parts?.find(
      (part) => typeof part.text === 'string',
    )?.text
    if (typeof text !== 'string') throw new Error('Gemini response did not contain text.')
    return parseContent(text)
  }
}
