import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, createAuthErrorResponse } from '@/lib/api-auth'
import { defaultRateLimit } from '@/lib/rate-limit'
import { orchestrate3PhaseValidation } from '@/lib/orchestrator'
import { storeResult } from '@/lib/result-store'
import type { APIError, ValidationResult } from '@/types/validation'

const MAX_IDEA_LENGTH = 10000
const MIN_IDEA_LENGTH = 10

interface AnalyzeRequest {
  idea?: string
  async?: boolean
  callback_url?: string
}

function createErrorResponse(code: string, message: string, status: number) {
  const error: APIError = {
    code,
    message,
    details: []
  }
  return NextResponse.json({ success: false, error }, { status })
}

export async function POST(request: NextRequest) {
  const authResult = validateApiKey(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult)
  }

  const rateLimitResult = await defaultRateLimit(request)
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return createErrorResponse('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  if (typeof body !== 'object' || body === null) {
    return createErrorResponse('INVALID_BODY', 'Request body must be a JSON object', 400)
  }

  const { idea, async: isAsync, callback_url } = body as AnalyzeRequest

  if (typeof idea !== 'string') {
    return createErrorResponse('MISSING_IDEA', 'Field "idea" is required and must be a string', 400)
  }

  const trimmedIdea = idea.trim()

  if (trimmedIdea.length < MIN_IDEA_LENGTH) {
    return createErrorResponse('IDEA_TOO_SHORT', `Idea must be at least ${MIN_IDEA_LENGTH} characters`, 400)
  }

  if (trimmedIdea.length > MAX_IDEA_LENGTH) {
    return createErrorResponse('IDEA_TOO_LONG', `Idea must not exceed ${MAX_IDEA_LENGTH} characters`, 400)
  }

  if (callback_url && typeof callback_url !== 'string') {
    return createErrorResponse('INVALID_CALLBACK', 'callback_url must be a string URL', 400)
  }

  try {
    const validationResult: ValidationResult = await orchestrate3PhaseValidation(trimmedIdea)

    const resultId = await storeResult(validationResult, {
      partialFailures: validationResult.partialFailures,
      phases: validationResult.phases
    })

    if (isAsync && callback_url) {
      ;(async () => {
        try {
          await fetch(callback_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Result-Id': resultId
            },
            body: JSON.stringify({
              success: true,
              data: validationResult,
              resultId
            })
          })
        } catch (callbackError) {
          console.error('[api/v1/analyze] Callback failed:', callbackError)
        }
      })()

      return NextResponse.json({
        success: true,
        data: {
          resultId,
          status: 'processing',
          message: 'Analysis started. Result will be sent to callback_url.'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: validationResult,
      resultId
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return createErrorResponse('ANALYSIS_ERROR', message, 500)
  }
}
