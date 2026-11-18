'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { JobFields } from '@/components/JobForm'
import { rebuild } from '@/lib/latex/rebuild'
import type { Mode } from '@/lib/mode'
import type { ResumeSource } from '@/lib/resume/source'
import { rewriteLoop } from '@/hooks/rewriteLoop'
import { score } from '@/lib/score'
import type { Analysis, Change } from '@/lib/uiTypes'

export type Health = { message: string; hint?: string }

export function useTailor(mode: Mode, sampleTex: string) {
  const [tex, setTex] = useState(sampleTex)
  const [source, setSource] = useState<ResumeSource>('sample')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [changes, setChanges] = useState<Change[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)
  const [health, setHealth] = useState<Health | null>(null)
  const [fields, setFields] = useState<JobFields | null>(null)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    if (mode !== 'personal') return
    fetch('/api/base')
      .then((response) => response.json())
      .then((data: { exists: boolean; tex: string }) => {
        if (data.exists) {
          setTex(data.tex)
          setSource('saved')
        }
      })
      .catch(() => {})
    fetch('/api/health')
      .then((response) => response.json())
      .then((data: { ok: boolean; message: string; hint?: string }) => {
        if (!data.ok) setHealth({ message: data.message, hint: data.hint })
      })
      .catch(() => {})
  }, [mode])

  const jd = useMemo(
    () =>
      analysis && {
        roleTitle: analysis.roleTitle,
        requiredSkills: analysis.requiredSkills,
        niceToHaveSkills: analysis.niceToHaveSkills,
        keywords: [...analysis.present, ...analysis.missing],
      },
    [analysis],
  )
  const tailoredTex = useMemo(
    () =>
      rebuild(
        tex,
        changes
          .filter((change) => change.decision === 'accepted' && change.status === 'rewritten')
          .map((change) => ({ id: change.id, newText: change.proposed })),
      ),
    [tex, changes],
  )
  const after = jd ? score(jd, tailoredTex).score : 0

  function useOwn(next: string) {
    setTex(next)
    setSource('uploaded')
    setAnalysis(null)
  }

  function replaceDone() {
    setSource('saved')
    setAnalysis(null)
  }

  async function rewriteAll(data: Analysis) {
    const abort = new AbortController()
    controller.current = abort
    setRunning(true)
    setDone(0)
    await rewriteLoop({
      data,
      resumeText: tex,
      signal: abort.signal,
      onProgress: setDone,
      onChange: (change) => setChanges((current) => [...current, change]),
    })
    setRunning(false)
    controller.current = null
  }

  async function analyzeJob(fields: JobFields) {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex, jd: fields.jd }),
    })
    if (!response.ok) return
    const data = (await response.json()) as Analysis
    setAnalysis(data)
    setFields(fields)
    setSource(data.source)
    setChanges([])
    void rewriteAll(data)
  }

  async function saveCurrent(): Promise<boolean> {
    if (!analysis || !fields) return false
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: fields.company,
        role: fields.role,
        url: fields.url,
        jd: fields.jd,
        tex: tailoredTex,
        report: {
          before: analysis.score,
          after,
          present: analysis.present,
          missing: analysis.missing,
        },
      }),
    })
    return response.ok
  }

  function decide(id: string, decision: 'accepted' | 'rejected') {
    setChanges((current) =>
      current.map((change) => (change.id === id ? { ...change, decision } : change)),
    )
  }

  function cancel() {
    controller.current?.abort()
  }

  return {
    tex, source, analysis, changes, running, done, health, after, tailoredTex,
    useOwn, replaceDone, analyzeJob, decide, cancel, saveCurrent,
  }
}
