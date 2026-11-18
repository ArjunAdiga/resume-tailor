'use client'

import { useState } from 'react'
import { PdfButton, type PdfState } from '@/components/PdfButton'
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type ApplicationSummary,
} from '@/lib/uiTypes'

type PdfResponse = {
  ok?: boolean
  url?: string
  pages?: number
  warning?: string | null
  error?: string
  log?: string[]
}

function link(folder: string, file: string, label: string) {
  const href = `/api/applications?folder=${encodeURIComponent(folder)}&file=${encodeURIComponent(file)}`
  return <a className="text-blue-600 underline" href={href}>{label}</a>
}

export function ApplicationsTable({
  applications,
  pdfAvailable,
}: {
  applications: ApplicationSummary[]
  pdfAvailable: boolean
}) {
  const [statuses, setStatuses] = useState<Record<string, ApplicationStatus>>({})
  const [pdf, setPdf] = useState<Record<string, PdfState>>({})

  async function change(folder: string, status: ApplicationStatus) {
    setStatuses((current) => ({ ...current, [folder]: status }))
    const response = await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, status }),
    })
    if (!response.ok) {
      setStatuses((current) => {
        const next = { ...current }
        delete next[folder]
        return next
      })
    }
  }

  async function build(folder: string) {
    setPdf((current) => ({ ...current, [folder]: { busy: true } }))
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    })
    const data = (await response.json()) as PdfResponse
    if (!response.ok || !data.ok) {
      setPdf((current) => ({
        ...current,
        [folder]: { error: data.error ?? 'PDF failed.', log: data.log },
      }))
      return
    }
    setPdf((current) => ({
      ...current,
      [folder]: { url: data.url, pages: data.pages, warning: data.warning },
    }))
  }

  const hint = !pdfAvailable
    ? <p className="text-sm text-amber-600">Install Tectonic to enable PDF downloads.</p>
    : null

  if (applications.length === 0) {
    return <div className="space-y-2">{hint}<p className="text-sm text-zinc-500">No saved applications yet.</p></div>
  }

  return (
    <div className="space-y-2">
      {hint}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-zinc-500">
              <th className="p-2">Company</th>
              <th className="p-2">Role</th>
              <th className="p-2">Date</th>
              <th className="p-2">Score</th>
              <th className="p-2">Status</th>
              <th className="p-2">Files</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.folder} className="border-b">
                <td className="p-2">{application.company}</td>
                <td className="p-2">{application.role}</td>
                <td className="p-2">{application.date}</td>
                <td className="p-2">{application.scoreBefore}% → {application.scoreAfter}%</td>
                <td className="p-2">
                  <select
                    className="rounded-md border border-zinc-300 bg-transparent p-1 text-sm dark:border-zinc-700"
                    value={statuses[application.folder] ?? application.status}
                    onChange={(event) =>
                      void change(application.folder, event.target.value as ApplicationStatus)
                    }
                  >
                    {APPLICATION_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-2">
                    <PdfButton
                      folder={application.folder}
                      available={pdfAvailable}
                      state={pdf[application.folder]}
                      build={(folder) => void build(folder)}
                    />
                    {link(application.folder, 'resume.tailored.tex', 'resume')}
                    {link(application.folder, 'jd.txt', 'JD')}
                    {link(application.folder, 'report.json', 'report')}
                    {link(application.folder, 'meta.json', 'meta')}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
