export type Mode = 'personal' | 'demo'

export function getMode(): Mode {
  if (process.env.VERCEL !== undefined) return 'demo'
  if (process.env.APP_MODE === 'demo') return 'demo'
  return 'personal'
}

export function isLocalOnlyAllowed(): boolean {
  return getMode() === 'personal'
}
