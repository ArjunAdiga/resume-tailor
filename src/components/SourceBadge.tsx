import type { ResumeSource } from '@/lib/resume/source'
import { Badge } from '@/components/ui/badge'

const labels: Record<ResumeSource, string> = {
  uploaded: 'Using: pasted resume',
  saved: 'Using: your saved resume',
  sample: 'Using: sample resume (demo data)',
}

export function SourceBadge({ source }: { source: ResumeSource }) {
  return <Badge variant="outline">{labels[source]}</Badge>
}
