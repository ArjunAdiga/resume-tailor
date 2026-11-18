import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '../src/app/api/pdf/route'
import { compileApplicationPdf, countBasePages, tectonicAvailable } from '../src/lib/pdf'

vi.mock('../src/lib/pdf', () => ({
  compileApplicationPdf: vi.fn(),
  countBasePages: vi.fn(),
  tectonicAvailable: vi.fn(),
  PDF_FILE: 'resume.tailored.pdf',
}))

const originalVercel = process.env.VERCEL
const originalAppMode = process.env.APP_MODE
const folder = '2026-01-02_acme-dev_engineer'

function request(body: unknown): Request {
  return new Request('http://localhost/api/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.VERCEL
  delete process.env.APP_MODE
})

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = originalVercel
  if (originalAppMode === undefined) delete process.env.APP_MODE
  else process.env.APP_MODE = originalAppMode
})

describe('pdf route', () => {
  it('returns 404 in demo mode', async () => {
    process.env.APP_MODE = 'demo'
    expect((await GET()).status).toBe(404)
    expect((await POST(request({ folder }))).status).toBe(404)
  })

  it('reports Tectonic availability', async () => {
    vi.mocked(tectonicAvailable).mockResolvedValue(true)
    expect(await (await GET()).json()).toEqual({ available: true })
  })

  it('warns when the compiled PDF exceeds the base resume', async () => {
    vi.mocked(compileApplicationPdf).mockResolvedValue({ ok: true, pages: 3, log: [] })
    vi.mocked(countBasePages).mockResolvedValue(2)

    const response = await POST(request({ folder }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pages).toBe(3)
    expect(data.basePages).toBe(2)
    expect(data.warning).toContain('base resume has 2')
    expect(data.url).toBe(
      '/api/applications?folder=2026-01-02_acme-dev_engineer&file=resume.tailored.pdf',
    )
  })

  it('does not warn when the PDF fits the base resume', async () => {
    vi.mocked(compileApplicationPdf).mockResolvedValue({ ok: true, pages: 1, log: [] })
    vi.mocked(countBasePages).mockResolvedValue(2)
    const data = await (await POST(request({ folder }))).json()
    expect(data.warning).toBeNull()
  })

  it('returns 503 when Tectonic is missing', async () => {
    vi.mocked(compileApplicationPdf).mockResolvedValue({
      ok: false, error: 'Tectonic is not installed.', log: [], missing: true,
    })
    const response = await POST(request({ folder }))
    expect(response.status).toBe(503)
  })

  it('rejects invalid folders', async () => {
    const response = await POST(request({}))
    expect(response.status).toBe(400)
    expect(compileApplicationPdf).not.toHaveBeenCalled()
  })
})
