import type { z } from 'zod'
import type { LLMProvider } from './provider'

type Call = { system: string; user: string }

export class FakeProvider implements LLMProvider {
  private readonly queue: unknown[] = []
  readonly calls: Call[] = []

  constructor(responses: unknown[] = []) {
    this.queue.push(...responses)
  }

  enqueue(response: unknown): void {
    this.queue.push(response)
  }

  async generateJson<T>(opts: {
    system: string
    user: string
    schema: z.ZodType<T>
  }): Promise<T> {
    this.calls.push({ system: opts.system, user: opts.user })
    const next = this.queue.shift()
    if (next === undefined) {
      throw new Error('FakeProvider has no queued response')
    }
    return opts.schema.parse(next)
  }
}
