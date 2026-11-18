import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { isLocalOnlyAllowed } from '../../../lib/mode'

const bodySchema = z.object({ tex: z.string() })

function baseFile(): string {
  return join(process.cwd(), 'private', 'base.tex')
}

function demoNotFound(): Response {
  return Response.json({ error: 'This endpoint is only available in personal mode.' }, { status: 404 })
}

export async function GET(): Promise<Response> {
  if (!isLocalOnlyAllowed()) return demoNotFound()
  const file = baseFile()
  if (!existsSync(file)) return Response.json({ exists: false, tex: '' })
  return Response.json({ exists: true, tex: readFileSync(file, 'utf8') })
}

export async function POST(request: Request): Promise<Response> {
  if (!isLocalOnlyAllowed()) return demoNotFound()

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Expected a JSON body.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json({ error: 'Expected { "tex": string }.' }, { status: 400 })
  }

  const file = baseFile()
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, parsed.data.tex, 'utf8')
  return Response.json({ ok: true, exists: true })
}
