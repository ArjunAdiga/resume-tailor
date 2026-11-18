import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Change } from '@/lib/uiTypes'

export function DiffList({
  changes,
  onAccept,
  onReject,
}: {
  changes: Change[]
  onAccept: (id: string) => void
  onReject: (id: string) => void
}) {
  const rewritten = changes.filter((change) => change.status === 'rewritten')
  const kept = changes.filter((change) => change.status === 'kept')

  return (
    <div className="space-y-3">
      {rewritten.map((change) => (
        <Card key={change.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>{change.id}</CardTitle>
            <Badge variant={change.decision === 'accepted' ? 'success' : 'outline'}>
              {change.decision === 'pending' ? 'Review' : change.decision}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-zinc-500 line-through">{change.original}</p>
            <p className="text-green-700">{change.proposed}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onAccept(change.id)}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => onReject(change.id)}>Reject</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {kept.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Kept as-is</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {kept.map((change) => (
              <p key={change.id} className="text-zinc-500">{change.original}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
