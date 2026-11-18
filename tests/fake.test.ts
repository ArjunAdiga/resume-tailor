import { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { FakeProvider } from '../src/lib/llm/fake'

const schema = z.object({ text: z.string() })

describe('FakeProvider', () => {
  it('returns queued responses validated by the schema', async () => {
    const llm = new FakeProvider([{ text: 'first' }, { text: 'second' }])
    await expect(llm.generateJson({ system: 's', user: 'u', schema })).resolves.toEqual({ text: 'first' })
    await expect(llm.generateJson({ system: 's', user: 'u', schema })).resolves.toEqual({ text: 'second' })
  })

  it('fails when the queue is empty', async () => {
    const llm = new FakeProvider()
    await expect(llm.generateJson({ system: 's', user: 'u', schema })).rejects.toThrow(/no queued response/)
  })

  it('rejects a response that does not match the schema', async () => {
    const llm = new FakeProvider([{ wrong: true }])
    await expect(llm.generateJson({ system: 's', user: 'u', schema })).rejects.toThrow()
  })

  it('records calls and supports enqueue', async () => {
    const llm = new FakeProvider()
    llm.enqueue({ text: 'queued' })
    await llm.generateJson({ system: 'prompt', user: 'question', schema })
    expect(llm.calls).toEqual([{ system: 'prompt', user: 'question' }])
  })
})
