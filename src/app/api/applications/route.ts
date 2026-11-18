import { z } from 'zod'
import {
  listApplications,
  readApplicationBinary,
  readApplicationFile,
  saveApplication,
  STATUSES,
  updateApplicationStatus,
} from '../../../lib/history'
import { getMode } from '../../../lib/mode'

const saveSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  url: z.string(),
  jd: z.string(),
  tex: z.string(),
  report: z.object({ before: z.number(), after: z.number() }).passthrough(),
  status: z.enum(STATUSES).optional(),
})

const statusSchema = z.object({
  folder: z.string(),
  status: z.enum(STATUSES),
})

function demoNotFound(): Response {
  return Response.json({ error: 'Applications are only available in personal mode.' }, { status: 404 })
}

async function parseBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function GET(request: Request): Promise<Response> {
  if (getMode() === 'demo') return demoNotFound()
  const url = new URL(request.url)
  const folder = url.searchParams.get('folder')
  const file = url.searchParams.get('file')
  if (folder && file) {
    const disposition = `attachment; filename="${file}"`
    if (file === 'resume.tailored.pdf') {
      const content = readApplicationBinary(folder, file)
      if (!content) return Response.json({ error: 'File not found.' }, { status: 404 })
      return new Response(new Uint8Array(content), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': disposition },
      })
    }
    const found = readApplicationFile(folder, file)
    if (!found) return Response.json({ error: 'File not found.' }, { status: 404 })
    return new Response(found.content, {
      headers: {
        'Content-Type': found.contentType,
        'Content-Disposition': disposition,
      },
    })
  }
  return Response.json({ applications: listApplications() })
}

export async function POST(request: Request): Promise<Response> {
  if (getMode() === 'demo') return demoNotFound()
  const parsed = saveSchema.safeParse(await parseBody(request))
  if (!parsed.success) return Response.json({ error: 'Invalid application.' }, { status: 400 })
  return Response.json({ ok: true, meta: saveApplication(parsed.data) }, { status: 201 })
}

export async function PATCH(request: Request): Promise<Response> {
  if (getMode() === 'demo') return demoNotFound()
  const parsed = statusSchema.safeParse(await parseBody(request))
  if (!parsed.success) return Response.json({ error: 'Invalid status update.' }, { status: 400 })
  if (!updateApplicationStatus(parsed.data.folder, parsed.data.status)) {
    return Response.json({ error: 'Application not found.' }, { status: 404 })
  }
  return Response.json({ ok: true })
}
