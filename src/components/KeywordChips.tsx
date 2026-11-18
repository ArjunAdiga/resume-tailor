import { Badge } from '@/components/ui/badge'

function unique(items: string[]): string[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.trim().toLowerCase()
    if (key.length === 0 || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function KeywordChips({ present, missing }: { present: string[]; missing: string[] }) {
  const presentItems = unique(present)
  const missingItems = unique(missing)
  return (
    <div className="space-y-2">
      <div>
        <p className="mb-1 text-xs font-medium">Present</p>
        <div className="flex flex-wrap gap-1">
          {presentItems.map((keyword) => (
            <Badge key={keyword.toLowerCase()} variant="success">{keyword}</Badge>
          ))}
          {presentItems.length === 0 && <span className="text-xs text-zinc-500">None</span>}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium">Missing</p>
        <div className="flex flex-wrap gap-1">
          {missingItems.map((keyword) => (
            <Badge key={keyword.toLowerCase()} variant="warning">{keyword}</Badge>
          ))}
          {missingItems.length === 0 && <span className="text-xs text-zinc-500">None</span>}
        </div>
      </div>
    </div>
  )
}
