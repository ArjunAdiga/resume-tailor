import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ScoreCards({
  before,
  after,
  missing,
}: {
  before: number
  after: number
  missing: number
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Match before</CardTitle></CardHeader>
        <CardContent className="text-2xl font-semibold">{before}%</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Match after</CardTitle></CardHeader>
        <CardContent className="text-2xl font-semibold text-green-700">{after}%</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Missing keywords</CardTitle></CardHeader>
        <CardContent className="text-2xl font-semibold text-amber-700">{missing}</CardContent>
      </Card>
    </div>
  )
}
