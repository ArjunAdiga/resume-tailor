import { useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { SourceBadge } from '@/components/SourceBadge'
import type { Mode } from '@/lib/mode'
import type { ResumeSource } from '@/lib/resume/source'

type Props = {
  mode: Mode
  source: ResumeSource
  tex: string
  onUse: (tex: string) => void
  onReplace: () => void
}

export function SourcePanel({ mode, source, tex, onUse, onReplace }: Props) {
  const [open, setOpen] = useState(false)
  const [pasted, setPasted] = useState('')
  const [message, setMessage] = useState('')

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) setPasted(await file.text())
  }

  async function replaceSaved() {
    const response = await fetch('/api/base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex }),
    })
    setMessage(response.ok ? 'Saved resume updated.' : 'Could not update the saved resume.')
    if (response.ok) onReplace()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume source</CardTitle>
        <SourceBadge source={source} />
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" onClick={() => setOpen(!open)}>
          Use my own resume
        </Button>
        {open && (
          <div className="space-y-2">
            <input
              type="file"
              accept=".tex,text/plain"
              onChange={onFile}
              className="block w-full text-xs"
              aria-label="Upload .tex resume"
            />
            <Textarea
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              placeholder="Or paste your LaTeX resume here"
              aria-label="Paste LaTeX resume"
            />
            <Button size="sm" onClick={() => onUse(pasted)} disabled={!pasted.trim()}>
              Use this resume
            </Button>
          </div>
        )}
        {mode === 'personal' && (
          <Button variant="ghost" size="sm" onClick={replaceSaved}>
            Replace saved resume
          </Button>
        )}
        {message && <p className="text-xs text-zinc-500">{message}</p>}
      </CardContent>
    </Card>
  )
}
