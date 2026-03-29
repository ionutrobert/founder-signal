import { NextResponse } from 'next/server'

import { getResult } from '@/lib/result-store'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: Request,
  { params }: RouteParams
) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ID', message: 'Result ID is required' } },
      { status: 400 }
    )
  }

  const result = await getResult(id)

  if (!result) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Result not found or expired' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: result })
}
