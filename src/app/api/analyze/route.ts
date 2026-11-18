import { z } from 'zod'
import { parse } from '../../../lib/latex/parse'
import { checkDemoLimits, countResumeBullets } from '../../../lib/limits'
import { getProvider } from '../../../lib/llm'
import { getMode } from '../../../lib/mode'
import { extractJdSystem, extractJdUser } from '../../../lib/prompts/extractJd'
import { resolveResume } from '../../../lib/resume/source'
import { jdSchema } from '../../../lib/schemas'
import { score } from '../../../lib/score'

const requestSchema = z.object({
  tex: z.string().optional(),
  jd: z.string().min(1),
})

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
    return respond(400, { error: 'Expected { jd: string, tex?: string }.' }, started)
  }

  const resolved = resolveResume(parsed.data.tex)
  const limited = await checkDemoLimits(request, {
    resume: resolved.tex,
    jd: parsed.data.jd,
    bullets: countResumeBullets(resolved.tex),
  })
  if (!limited.ok) return respond(limited.status, { error: limited.error }, started)

  const bullets = parse(resolved.tex)
  let jd: z.infer<typeof jdSchema>
  try {
    jd = await getProvider().generateJson({
      system: extractJdSystem,
      user: extractJdUser(parsed.data.jd),
      schema: jdSchema,
    })
  } catch {
    return respond(
      502,
      { error: 'Could not analyze the job description. Check the model provider and try again.' },
      started,
    )
  }

  const result = score(jd, resolved.tex)
  return respond(200, {
    ...result,
    source: resolved.source,
    roleTitle: jd.roleTitle,
    requiredSkills: jd.requiredSkills,
    niceToHaveSkills: jd.niceToHaveSkills,
    bullets: bullets.map(({ id, text }) => ({ id, text })),
  }, started)
}
