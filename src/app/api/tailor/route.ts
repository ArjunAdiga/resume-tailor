import { z } from 'zod'
import { checkBullet } from '../../../lib/guards'
import { escape } from '../../../lib/latex/escape'
import { getProvider } from '../../../lib/llm'
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

export async function POST(request: Request): Promise<Response> {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Expected a JSON body.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      { error: 'Expected { id, bullet, resumeText, matchedKeywords }.' },
      { status: 400 },
    )
  }

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
      return Response.json(body)
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
  return Response.json(kept)
}
