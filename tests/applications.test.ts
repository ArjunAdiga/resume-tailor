import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listApplications,
  readApplicationBinary,
  readApplicationFile,
  saveApplication,
  updateApplicationStatus,
} from '../src/lib/history'
import { GET, PATCH, POST } from '../src/app/api/applications/route'

vi.mock('../src/lib/history', () => ({
  listApplications: vi.fn(),
  readApplicationBinary: vi.fn(),
  readApplicationFile: vi.fn(),
  saveApplication: vi.fn(),
  updateApplicationStatus: vi.fn(),
  STATUSES: ['saved', 'applied', 'interview', 'rejected', 'offer'],
}))

const originalVercel = process.env.VERCEL
const originalAppMode = process.env.APP_MODE

function jsonRequest(method: string, body: unknown): Request {
  return new Request('http://localhost/api/applications', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(body),
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

describe('applications route', () => {
  it('returns 404 in demo mode', async () => {
    process.env.APP_MODE = 'demo'
    expect((await GET(jsonRequest('GET', null))).status).toBe(404)
    expect((await POST(jsonRequest('POST', {}))).status).toBe(404)
    expect((await PATCH(jsonRequest('PATCH', {}))).status).toBe(404)
  })

  it('lists applications in personal mode', async () => {
    vi.mocked(listApplications).mockReturnValue([])
    const response = await GET(jsonRequest('GET', null))
    expect(await response.json()).toEqual({ applications: [] })
  })

  it('serves an allowlisted file', async () => {
    vi.mocked(readApplicationFile).mockReturnValue({ content: 'JD', contentType: 'text/plain' })
    const request = new Request('http://localhost/api/applications?folder=2026-01-02_acme-dev&file=jd.txt')
    const response = await GET(request)
    expect(await response.text()).toBe('JD')
  })

  it('serves a compiled PDF as binary', async () => {
    vi.mocked(readApplicationBinary).mockReturnValue(Buffer.from([37, 80, 68, 70]))
    const request = new Request('http://localhost/api/applications?folder=2026-01-02_acme-dev_engineer&file=resume.tailored.pdf')
    const response = await GET(request)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([37, 80, 68, 70])
  })

  it('saves a valid application', async () => {
    vi.mocked(saveApplication).mockReturnValue({ company: 'Acme', role: 'Dev', url: '', date: '2026-01-02', status: 'saved' })
    const response = await POST(jsonRequest('POST', {
      company: 'Acme', role: 'Dev', url: '', jd: 'JD', tex: 'TEX', report: { before: 40, after: 70 },
    }))
    expect(response.status).toBe(201)
    expect(saveApplication).toHaveBeenCalledTimes(1)
  })

  it('updates a status', async () => {
    vi.mocked(updateApplicationStatus).mockReturnValue(true)
    const response = await PATCH(jsonRequest('PATCH', { folder: '2026-01-02_acme-dev', status: 'applied' }))
    expect(response.status).toBe(200)
  })
})
