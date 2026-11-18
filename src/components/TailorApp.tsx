'use client'

import { DiffList } from '@/components/DiffList'
import { DownloadBar } from '@/components/DownloadBar'
import { JobForm } from '@/components/JobForm'
import { KeywordChips } from '@/components/KeywordChips'
import { ScoreCards } from '@/components/ScoreCards'
import { SourcePanel } from '@/components/SourcePanel'
import { useTailor } from '@/hooks/useTailor'
import type { Mode } from '@/lib/mode'

type Props = { mode: Mode; sampleTex: string; sampleJd: string }

export default function TailorApp({ mode, sampleTex, sampleJd }: Props) {
  const {
    tex, source, analysis, changes, running, done, health, after, tailoredTex,
    useOwn, replaceDone, analyzeJob, decide, cancel, saveCurrent,
  } = useTailor(mode, sampleTex)

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Resume Tailor</h1>
      {mode === 'personal' && <a className="text-sm underline" href="/applications">Applications</a>}
      {mode === 'demo' && (
        <p className="text-xs text-zinc-500">
          Your text is sent to Google&apos;s Gemini API to generate suggestions. Nothing is stored by this app. Use the sample or run the app locally for sensitive resumes.
        </p>
      )}
      {health && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
          <p>{health.message}</p>
          <p className="text-xs">Fix: {health.hint}</p>
        </div>
      )}
      <SourcePanel
        mode={mode}
        source={source}
        tex={tex}
        onUse={useOwn}
        onReplace={replaceDone}
      />
      <JobForm sampleJd={sampleJd} busy={running} onSubmit={analyzeJob} />
      {analysis && (
        <>
          {running || done > 0 ? (
            <div className="space-y-1">
              <p className="text-sm">Rewriting {done} of {analysis.bullets.length}</p>
              <div className="h-2 w-full rounded bg-zinc-200">
                <div
                  className="h-2 rounded bg-zinc-900 transition-all"
                  style={{ width: `${(done / analysis.bullets.length) * 100}%` }}
                />
              </div>
              <button className="text-xs underline" onClick={cancel}>Cancel</button>
            </div>
          ) : null}
          <ScoreCards before={analysis.score} after={after} missing={analysis.missing.length} />
          <KeywordChips present={analysis.present} missing={analysis.missing} />
          <DiffList
            changes={changes}
            onAccept={(id) => decide(id, 'accepted')}
            onReject={(id) => decide(id, 'rejected')}
          />
          <DownloadBar tex={tailoredTex} onSave={saveCurrent} />
        </>
      )}
    </main>
  )
}
