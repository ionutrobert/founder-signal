import { NextResponse } from 'next/server'
import type { APIError } from '../../../types/validation'

const MAX_IDEA_LENGTH = 10000
const MIN_IDEA_LENGTH = 10

interface AnalyzeRequest {
  idea?: string
}

function createErrorResponse(code: string, message: string, status: number) {
  const error: APIError = {
    code,
    message,
    details: []
  }
  return NextResponse.json({ success: false, error }, { status })
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return createErrorResponse('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  if (typeof body !== 'object' || body === null) {
    return createErrorResponse('INVALID_BODY', 'Request body must be a JSON object', 400)
  }

  const { idea } = body as AnalyzeRequest

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

  try {
    const { analyzeIdea } = await import('../../../lib/nim-client')
    const { parseValidationReport } = await import('../../../lib/json-parser')

    const rawResponse = await analyzeIdea(trimmedIdea)
    const report = parseValidationReport(rawResponse)

    if (!report) {
      return createErrorResponse('PARSE_ERROR', 'Failed to parse validation response', 500)
    }

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return createErrorResponse('API_ERROR', message, 500)
  }
}
