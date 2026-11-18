import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { ApplicationsTable } from '@/components/ApplicationsTable'
import { listApplications } from '@/lib/history'
import { getMode } from '@/lib/mode'
import { tectonicAvailable } from '@/lib/pdf'

async function ApplicationsList() {
  await connection()
  const applications = listApplications()
  const pdfAvailable = await tectonicAvailable()
  return <ApplicationsTable applications={applications} pdfAvailable={pdfAvailable} />
}

export default function ApplicationsPage() {
  if (getMode() === 'demo') notFound()

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Applications</h1>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading...</p>}>
        <ApplicationsList />
      </Suspense>
    </main>
  )
}
