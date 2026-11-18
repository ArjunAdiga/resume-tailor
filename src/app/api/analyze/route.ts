import { z } from 'zod'
import { parse } from '../../../lib/latex/parse'
import { getProvider } from '../../../lib/llm'
import { extractJdSystem, extractJdUser } from '../../../lib/prompts/extractJd'
import { resolveResume } from '../../../lib/resume/source'
import { jdSchema } from '../../../lib/schemas'
import { score } from '../../../lib/score'

const requestSchema = z.object({
  tex: z.string().optional(),
  jd: z.string().min(1),
})

function badRequest(error: string): Response {
  return Response.json({ error }, { status: 400 })
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return badRequest('Expected a JSON body.')
  }

  const parsed = requestSchema.safeParse(payload)
  if (!parsed.success) {
    return badRequest('Expected { jd: string, tex?: string }.')
  }

  const resolved = resolveResume(parsed.data.tex)
  const bullets = parse(resolved.tex)

  let jd: z.infer<typeof jdSchema>
  try {
    jd = await getProvider().generateJson({
      system: extractJdSystem,
      user: extractJdUser(parsed.data.jd),
      schema: jdSchema,
    })
  } catch {
    return Response.json(
      { error: 'Could not analyze the job description. Check the model provider and try again.' },
      { status: 502 },
    )
  }

  const result = score(jd, resolved.tex)
  return Response.json({
    ...result,
    source: resolved.source,
    roleTitle: jd.roleTitle,
    requiredSkills: jd.requiredSkills,
    niceToHaveSkills: jd.niceToHaveSkills,
    bullets: bullets.map(({ id, text }) => ({ id, text })),
  })
}
