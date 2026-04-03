const DAILY_LIMIT = 1
const DAY_MS = 24 * 60 * 60 * 1000

interface DailyLimitEntry {
count: number
resetAt: number
}

const dailyLimitStore = new Map<string, DailyLimitEntry>()

function cleanupExpiredEntries(): void {
const now = Date.now()
for (const [key, entry] of dailyLimitStore.entries()) {
if (entry.resetAt < now) {
dailyLimitStore.delete(key)
}
}
}

export function getFingerprint(request: Request): string {
const forwarded = request.headers.get('x-forwarded-for')
const ip = forwarded ? forwarded.split(',')[0]!.trim() : 
request.headers.get('x-real-ip') || 
'unknown'
const userAgent = request.headers.get('user-agent') || 'unknown'

return `${ip}:${userAgent.slice(0, 50)}`
}

export function checkDailyLimit(fingerprint: string): { allowed: boolean; remaining: number; resetAt: number } {
cleanupExpiredEntries()

const now = Date.now()
const entry = dailyLimitStore.get(fingerprint)

if (!entry || entry.resetAt < now) {
const resetAt = now + DAY_MS
dailyLimitStore.set(fingerprint, { count: 0, resetAt })
return { allowed: true, remaining: DAILY_LIMIT, resetAt }
}

const remaining = Math.max(0, DAILY_LIMIT - entry.count)
return { 
allowed: entry.count < DAILY_LIMIT, 
remaining, 
resetAt: entry.resetAt 
}
}

export function incrementDailyUsage(fingerprint: string): void {
const now = Date.now()
let entry = dailyLimitStore.get(fingerprint)

if (!entry || entry.resetAt < now) {
entry = { count: 0, resetAt: now + DAY_MS }
}

entry.count++
dailyLimitStore.set(fingerprint, entry)
}
