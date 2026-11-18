import { afterEach, describe, expect, it } from 'vitest'
import { getMode, isLocalOnlyAllowed } from '../src/lib/mode'

const originalVercel = process.env.VERCEL
const originalAppMode = process.env.APP_MODE

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = originalVercel
  if (originalAppMode === undefined) delete process.env.APP_MODE
  else process.env.APP_MODE = originalAppMode
})

describe('getMode', () => {
  it('defaults to personal', () => {
    delete process.env.VERCEL
    delete process.env.APP_MODE
    expect(getMode()).toBe('personal')
    expect(isLocalOnlyAllowed()).toBe(true)
  })

  it('uses demo when APP_MODE is demo', () => {
    delete process.env.VERCEL
    process.env.APP_MODE = 'demo'
    expect(getMode()).toBe('demo')
    expect(isLocalOnlyAllowed()).toBe(false)
  })

  it('uses demo when VERCEL is set', () => {
    delete process.env.APP_MODE
    process.env.VERCEL = '1'
    expect(getMode()).toBe('demo')
  })

  it('ignores non-demo APP_MODE values', () => {
    delete process.env.VERCEL
    process.env.APP_MODE = 'personal'
    expect(getMode()).toBe('personal')
  })
})
