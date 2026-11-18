import { z } from 'zod'
import { checkBullet } from '../../../lib/guards'
import { escape } from '../../../lib/latex/escape'
import { checkDemoLimits } from '../../../lib/limits'
import { getProvider } from '../../../lib/llm'
import { getMode } from '../../../lib/mode'
import { rewriteBulletSystem, rewriteBulletUser } from '../../../lib/prompts/rewriteBullet'
import { rewriteSchema } from '../../../lib/schemas'

const requestSchema = z.object({
  id: z.string(),
  bullet: z.string(),
  resumeText: z.string(),
  matchedKeywords: z.array(z.string()),
})

type ResponseBody = {
  id: string
  original: string
  proposed: string
  status: 'rewritten' | 'kept'
  reasons: string[]
}

function respond(status: number, body: unknown, started: number): Response {
  if (getMode() === 'demo') console.log(JSON.stringify({ status, ms: Date.now() - started }))
  return Response.json(body, { status })
}

export async function POST(request: Request): Promise<Response> {
  const started = Date.now()
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return respond(400, { error: 'Expected a JSON body.' }, started)
  }

  const parsed = requestSchema.safeParse(payload)
  if (!parsed.success) {
    return respond(
      400,
      { error: 'Expected { id, bullet, resumeText, matchedKeywords }.' },
      started,
    )
  }

  const limited = await checkDemoLimits(request, {
    resume: parsed.data.resumeText,
    jd: '',
    bullets: 1,
  })
  if (!limited.ok) return respond(limited.status, { error: limited.error }, started)

  const { id, bullet, resumeText, matchedKeywords } = parsed.data
  let reasons: string[] = []

  for (let attempt = 0; attempt < 2; attempt++) {
    let proposed: string
    try {
      proposed = (
        await getProvider().generateJson({
          system: rewriteBulletSystem,
          user: rewriteBulletUser({ bullet, resumeText, matchedKeywords, reasons }),
          schema: rewriteSchema,
        })
      ).proposed
    } catch {
      reasons = ['the model did not return a valid rewrite']
      break
    }

    const guard = checkBullet(bullet, proposed, resumeText)
    if (guard.ok) {
      const body: ResponseBody = {
        id,
        original: bullet,
        proposed: escape(proposed),
        status: 'rewritten',
        reasons: [],
      }
      return respond(200, body, started)
    }
    reasons = guard.reasons
  }

  const kept: ResponseBody = {
    id,
    original: bullet,
    proposed: bullet,
    status: 'kept',
    reasons,
  }
  return respond(200, kept, started)
}
