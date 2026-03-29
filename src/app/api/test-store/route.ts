import { NextResponse } from 'next/server'

import { getStoreStats } from '@/lib/result-store'

export async function GET() {
  const stats = await getStoreStats()
  return NextResponse.json({ success: true, data: stats })
}
