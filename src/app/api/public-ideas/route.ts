import { NextResponse } from 'next/server'
import { getPublicIdeas } from '@/lib/public-ideas'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const featured = searchParams.get('featured') === 'true'
	const limit = parseInt(searchParams.get('limit') || '10')

	const ideas = await getPublicIdeas({ featured, limit })

	return NextResponse.json({
		success: true,
		data: ideas.map(idea => ({
			id: idea.id,
			title: idea.title,
			oneLiner: idea.one_liner,
			category: idea.category,
			score: idea.score,
			verdict: idea.verdict,
			createdAt: idea.created_at,
			isFeatured: idea.is_featured
		})),
		total: ideas.length
	})
}
