'use client'

import type { Analysis, Change } from '@/lib/uiTypes'

type Args = {
  data: Analysis
  resumeText: string
  signal: AbortSignal
  onProgress: (done: number) => void
  onChange: (change: Change) => void
}

export async function rewriteLoop({
  data,
  resumeText,
  signal,
  onProgress,
  onChange,
}: Args): Promise<void> {
  for (let i = 0; i < data.bullets.length; i++) {
    if (signal.aborted) return
    const bullet = data.bullets[i]!
    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bullet.id,
          bullet: bullet.text,
          resumeText,
          matchedKeywords: data.present,
        }),
      })
      if (response.ok) {
        const result = (await response.json()) as Omit<Change, 'decision'>
        onChange({ ...result, decision: result.status === 'rewritten' ? 'pending' : 'accepted' })
      }
    } catch {
      return
    }
    onProgress(i + 1)
  }
}
