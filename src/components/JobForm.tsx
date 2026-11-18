import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export type JobFields = {
  company: string
  role: string
  url: string
  jd: string
}

type Errors = Partial<Record<keyof JobFields, string>>

const fieldClass =
  'w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700'

export function JobForm({
  sampleJd,
  busy,
  onSubmit,
}: {
  sampleJd: string
  busy: boolean
  onSubmit: (fields: JobFields) => void
}) {
  const [fields, setFields] = useState<JobFields>({ company: '', role: '', url: '', jd: '' })
  const [errors, setErrors] = useState<Errors>({})

  function update(key: keyof JobFields, value: string) {
    setFields((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const next: Errors = {}
    if (!fields.company.trim()) next.company = 'Company is required.'
    if (!fields.role.trim()) next.role = 'Role is required.'
    if (!fields.jd.trim()) next.jd = 'Paste a job description.'
    setErrors(next)
    if (Object.keys(next).length === 0) onSubmit(fields)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium">
              Company
              <input className={fieldClass} value={fields.company} onChange={(e) => update('company', e.target.value)} />
              {errors.company && <span className="block text-red-600">{errors.company}</span>}
            </label>
            <label className="space-y-1 text-xs font-medium">
              Role
              <input className={fieldClass} value={fields.role} onChange={(e) => update('role', e.target.value)} />
              {errors.role && <span className="block text-red-600">{errors.role}</span>}
            </label>
          </div>
          <label className="block space-y-1 text-xs font-medium">
            Job URL (optional)
            <input className={fieldClass} value={fields.url} onChange={(e) => update('url', e.target.value)} />
          </label>
          <label className="block space-y-1 text-xs font-medium">
            Job description
            <Textarea value={fields.jd} onChange={(e) => update('jd', e.target.value)} rows={8} />
            {errors.jd && <span className="block text-red-600">{errors.jd}</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>Analyze job</Button>
            <Button type="button" variant="outline" onClick={() => update('jd', sampleJd)}>
              Try the sample
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
