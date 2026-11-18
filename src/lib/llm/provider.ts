import type { z } from 'zod'

export interface LLMProvider {
  generateJson<T>(opts: {
    system: string
    user: string
    schema: z.ZodType<T>
  }): Promise<T>
}
