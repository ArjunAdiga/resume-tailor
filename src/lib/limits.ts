import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getMode } from './mode'

export const LIMITS = { resume: 30000, jd: 10000, bullets: 40, hourly: 60 } as const

export type LimitResult = { ok: true } | { ok: false; status: 413 | 429; error: string }
export type DemoLimitInput = { resume: string; jd: string; bullets: number }

type Bucket = { hour: number[]; day: number[] }
type Outcome = { success: boolean; reset: number }
type Limiters = { hour: Ratelimit; day: Ratelimit }

const HOUR = 3600000
const DAY = 86400000
const memory = new Map<string, Bucket>()
let cachedLimiters: Limiters | null | undefined

function dailyCap(): number {
  const value = Number(process.env.DAILY_LLM_CAP)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 500
}

function getLimiters(): Limiters | null {
  if (cachedLimiters !== undefined) return cachedLimiters
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    cachedLimiters = null
    return null
  }
  const redis = new Redis({ url, token })
  cachedLimiters = {
    hour: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.hourly, '1 h'), prefix: 'rt:hour' }),
    day: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(dailyCap(), '1 d'), prefix: 'rt:day' }),
  }
  return cachedLimiters
}

function memoryLimit(ip: string): Outcome {
  const now = Date.now()
  const bucket = memory.get(ip) ?? { hour: [], day: [] }
  bucket.hour = bucket.hour.filter((time) => now - time < HOUR)
  bucket.day = bucket.day.filter((time) => now - time < DAY)
  const hourFull = bucket.hour.length >= LIMITS.hourly
  const dayFull = bucket.day.length >= dailyCap()
  if (hourFull || dayFull) {
    memory.set(ip, bucket)
    const reset = hourFull ? bucket.hour[0]! + HOUR : bucket.day[0]! + DAY
    return { success: false, reset }
  }
  bucket.hour.push(now)
  bucket.day.push(now)
  memory.set(ip, bucket)
  return { success: true, reset: now + HOUR }
}

async function rateLimit(ip: string): Promise<Outcome> {
  const limiters = getLimiters()
  if (!limiters) return memoryLimit(ip)
  const [hour, day] = await Promise.all([limiters.hour.limit(ip), limiters.day.limit(ip)])
  return { success: hour.success && day.success, reset: Math.max(hour.reset, day.reset) }
}

function retryMessage(reset: number): string {
  const seconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  const label = minutes === 1 ? 'minute' : 'minutes'
  return `Demo rate limit reached. Please try again in ${minutes} ${label}.`
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim() || 'local'
  return request.headers.get('x-real-ip') ?? 'local'
}

export function countResumeBullets(tex: string): number {
  return (tex.match(/\\resumeItem\s*\{/g) ?? []).length
}

export function checkTextLimits(resume: string, jd: string, bullets: number): LimitResult {
  if (resume.length > LIMITS.resume) {
    return { ok: false, status: 413, error: `Demo resume limit is ${LIMITS.resume} characters.` }
  }
  if (jd.length > LIMITS.jd) {
    return { ok: false, status: 413, error: `Demo job description limit is ${LIMITS.jd} characters.` }
  }
  if (bullets > LIMITS.bullets) {
    return { ok: false, status: 413, error: `Demo limit is ${LIMITS.bullets} resume bullets.` }
  }
  return { ok: true }
}

export async function checkDemoLimits(request: Request, input: DemoLimitInput): Promise<LimitResult> {
  if (getMode() !== 'demo') return { ok: true }
  const text = checkTextLimits(input.resume, input.jd, input.bullets)
  if (!text.ok) return text
  const outcome = await rateLimit(clientIp(request))
  if (!outcome.success) return { ok: false, status: 429, error: retryMessage(outcome.reset) }
  return { ok: true }
}

export function resetLimitsForTests(): void {
  memory.clear()
  cachedLimiters = undefined
}
