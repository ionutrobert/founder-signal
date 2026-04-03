import { NextResponse } from 'next/server'

export async function GET() {
const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/public-ideas?featured=true&limit=6`)
const data = await response.json()
return NextResponse.json(data)
}
