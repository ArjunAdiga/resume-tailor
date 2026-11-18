'use client'

export type PdfState = {
  busy?: boolean
  url?: string
  pages?: number
  warning?: string | null
  error?: string
  log?: string[]
}

export function PdfButton({
  folder,
  available,
  state,
  build,
}: {
  folder: string
  available: boolean
  state?: PdfState
  build: (folder: string) => void
}) {
  if (!available) return null

  if (state?.url) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <a className="text-blue-600 underline" href={state.url}>PDF ({state.pages}p)</a>
        {state.warning && <span className="text-amber-600">{state.warning}</span>}
      </div>
    )
  }

  if (state?.error) {
    return (
      <div className="space-y-1">
        <button className="text-blue-600 underline" onClick={() => build(folder)}>Retry PDF</button>
        <p className="text-xs text-red-600">{state.error}</p>
        {state.log && state.log.length > 0 && (
          <details className="text-xs">
            <summary>Log</summary>
            <pre className="whitespace-pre-wrap">{state.log.join('\n')}</pre>
          </details>
        )}
      </div>
    )
  }

  return (
    <button className="text-blue-600 underline" disabled={state?.busy} onClick={() => build(folder)}>
      {state?.busy ? 'Building...' : 'PDF'}
    </button>
  )
}
