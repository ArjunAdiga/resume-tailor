type Tags = { models?: { name?: string }[] }

type Status = {
  ok: boolean
  message: string
  hint?: string
  baseUrl: string
  model: string
}

function unavailable(status: Status): Response {
  return Response.json(status, { status: 503 })
}

export async function GET(): Promise<Response> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
  const model = process.env.OLLAMA_MODEL ?? 'qwen3:4b'
  const startHint = `Start Ollama with "ollama serve" and check OLLAMA_BASE_URL (${baseUrl}).`

  let tags: Tags
  try {
    const response = await fetch(`${baseUrl}/api/tags`)
    if (!response.ok) {
      return unavailable({
        ok: false,
        message: `Ollama responded with status ${response.status}.`,
        hint: startHint,
        baseUrl,
        model,
      })
    }
    tags = (await response.json()) as Tags
  } catch {
    return unavailable({
      ok: false,
      message: `Cannot reach Ollama at ${baseUrl}.`,
      hint: startHint,
      baseUrl,
      model,
    })
  }

  const names = (tags.models ?? []).flatMap((entry) =>
    typeof entry.name === 'string' ? [entry.name] : [],
  )
  const found = names.some(
    (name) => name === model || (!model.includes(':') && name.split(':')[0] === model),
  )
  if (!found) {
    return unavailable({
      ok: false,
      message: `Model "${model}" is not installed.`,
      hint: `Run "ollama pull ${model}" or set OLLAMA_MODEL to an installed model.`,
      baseUrl,
      model,
    })
  }

  return Response.json({
    ok: true,
    message: `Ollama is reachable and "${model}" is installed.`,
    baseUrl,
    model,
  })
}
