import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, createAuthErrorResponse } from '@/lib/api-auth'
import { getResult, getStoreStats } from '@/lib/result-store'

export async function GET(request: NextRequest) {
  const authResult = validateApiKey(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult)
  }

  const url = new URL(request.url)
  const resultId = url.searchParams.get('result_id')

  if (resultId) {
    const result = await getResult(resultId)

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Result not found or expired. Results are stored for 1 hour.'
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  }

  const stats = await getStoreStats()

  return NextResponse.json({
    success: true,
    data: {
      status: 'operational',
      version: '1.0.0',
      storage: {
        cached_results: stats.size,
        max_age: '1 hour'
      }
    }
  })
}
