import { NextRequest, NextResponse } from 'next/server'

const API_KEY_PREFIX = 'fs_'
const API_KEY_ENV_VAR = 'FOUNDER_SIGNAL_API_KEY'

interface AuthResult {
  success: boolean
  error?: { code: string; message: string }
  keyId?: string
}

function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim()
    }
    return authHeader.trim()
  }

  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    return apiKey.trim()
  }

  const urlKey = request.nextUrl.searchParams.get('api_key')
  if (urlKey) {
    return urlKey.trim()
  }

  return null
}

function validateApiKeyFormat(key: string): boolean {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return false
  }
  const keyPart = key.slice(API_KEY_PREFIX.length)
  return keyPart.length >= 16 && /^[a-zA-Z0-9_-]+$/.test(keyPart)
}

export function validateApiKey(request: NextRequest): AuthResult {
  const configuredKey = process.env[API_KEY_ENV_VAR]

  if (!configuredKey) {
    return {
      success: false,
      error: {
        code: 'API_NOT_CONFIGURED',
        message: 'API authentication is not configured on this server'
      }
    }
  }

  const providedKey = extractApiKey(request)

  if (!providedKey) {
    return {
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key required. Provide via Authorization header, X-API-Key header, or api_key query param'
      }
    }
  }

  if (!validateApiKeyFormat(providedKey)) {
    return {
      success: false,
      error: {
        code: 'INVALID_KEY_FORMAT',
        message: `API key must start with '${API_KEY_PREFIX}' and contain at least 16 alphanumeric characters`
      }
    }
  }

  if (providedKey !== configuredKey) {
    return {
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'The provided API key is invalid'
      }
    }
  }

  const keyId = providedKey.slice(API_KEY_PREFIX.length, API_KEY_PREFIX.length + 8)

  return {
    success: true,
    keyId
  }
}

export function createAuthErrorResponse(result: AuthResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: result.error
    },
    { status: result.error?.code === 'MISSING_API_KEY' ? 401 : 403 }
  )
}

export function withApiKeyAuth(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>
): (request: NextRequest, context?: unknown) => Promise<NextResponse> {
  return async (request: NextRequest, context?: unknown) => {
    const authResult = validateApiKey(request)

    if (!authResult.success) {
      return createAuthErrorResponse(authResult)
    }

    return handler(request, context)
  }
}
