import { z } from 'zod'
import { getMode } from '../../../lib/mode'
import { compileApplicationPdf, countBasePages, PDF_FILE, tectonicAvailable } from '../../../lib/pdf'

const schema = z.object({ folder: z.string().min(1) })

function demoNotFound(): Response {
  return Response.json({ error: 'PDFs are only available in personal mode.' }, { status: 404 })
}

async function parseBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function GET(): Promise<Response> {
  if (getMode() === 'demo') return demoNotFound()
  return Response.json({ available: await tectonicAvailable() })
}

export async function POST(request: Request): Promise<Response> {
  if (getMode() === 'demo') return demoNotFound()
  const parsed = schema.safeParse(await parseBody(request))
  if (!parsed.success) return Response.json({ error: 'Invalid folder.' }, { status: 400 })

  const result = await compileApplicationPdf(parsed.data.folder)
  if (!result.ok) {
    return Response.json(result, { status: result.missing ? 503 : 400 })
  }

  const basePages = await countBasePages()
  const warning = basePages !== null && result.pages > basePages
    ? `PDF has ${result.pages} pages; base resume has ${basePages}.`
    : null
  const file = encodeURIComponent(PDF_FILE)
  const folder = encodeURIComponent(parsed.data.folder)
  return Response.json({
    ok: true,
    pages: result.pages,
    basePages,
    warning,
    url: `/api/applications?folder=${folder}&file=${file}`,
    log: result.log,
  })
}
