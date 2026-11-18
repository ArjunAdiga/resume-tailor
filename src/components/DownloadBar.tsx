import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DownloadBar({
  tex,
  onSave,
}: {
  tex: string
  onSave?: () => Promise<boolean>
}) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  function download() {
    const url = URL.createObjectURL(new Blob([tex], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'resume.tailored.tex'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function copy() {
    await navigator.clipboard.writeText(tex)
    setCopied(true)
  }

  async function save() {
    if (onSave && (await onSave())) setSaved(true)
  }

  return (
    <Card>
      <CardHeader><CardTitle>Tailored resume</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button onClick={download}>Download resume.tailored.tex</Button>
          <Button variant="outline" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          {onSave && (
            <Button variant="outline" onClick={save} disabled={saved}>
              {saved ? 'Saved' : 'Save application'}
            </Button>
          )}
        </div>
        <p className="text-xs text-zinc-500">Paste this into Overleaf to compile.</p>
      </CardContent>
    </Card>
  )
}
