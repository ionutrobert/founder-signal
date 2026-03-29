import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}

function getDefaultKeyGenerator(request: NextRequest): string {
  const apiKey = request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.nextUrl.searchParams.get('api_key') ||
    'anonymous'

  return `ratelimit:${apiKey}`
}

export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 60000,
    maxRequests = 10,
    keyGenerator = getDefaultKeyGenerator
  } = config

  return async function rateLimitMiddleware(
    request: NextRequest
  ): Promise<{ success: true } | { success: false; response: NextResponse }> {
    cleanupExpiredEntries()

    const key = keyGenerator(request)
    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs
      })
      return { success: true }
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
              details: {
                retryAfter,
                limit: maxRequests,
                window: `${windowMs / 1000}s`
              }
            }
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000))
            }
          }
        )
      }
    }

    entry.count++
    return { success: true }
  }
}

export const defaultRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 10
})

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 3
})
