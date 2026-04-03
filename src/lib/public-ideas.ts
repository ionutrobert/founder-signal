import { supabaseAdmin } from './supabase'

export interface PublicIdea {
	id: string
	title: string
	one_liner: string
	category: string
	score: number
	verdict: 'pass' | 'fail' | 'needs-work'
	is_featured: boolean
	created_at: string
	report_id?: string
	user_id?: string
	tags?: string[]
	view_count?: number
	upvote_count?: number
}

export async function createPublicIdea(data: {
	id: string
	title: string
	one_liner: string
	category: string
	score: number
	verdict: 'pass' | 'fail' | 'needs-work'
	report_data?: Record<string, unknown>
}): Promise<PublicIdea | null> {
  const { data: idea, error } = await supabaseAdmin
    .from('public_ideas')
    .insert({
      id: data.id,
      title: data.title,
      one_liner: data.one_liner,
      category: data.category,
      score: data.score,
      verdict: data.verdict,
      is_featured: data.score >= 60,
      status: 'approved',
      report_data: data.report_data,
    })
    .select()
    .single()

	if (error) {
		console.error('Error creating public idea:', error)
		return null
	}

	return idea
}

export async function getPublicIdeas(options?: {
  featured?: boolean
  limit?: number
}): Promise<PublicIdea[]> {
  let query = supabaseAdmin
    .from('public_ideas')
    .select('*')
    .eq('status', 'approved')
    .order('score', { ascending: false })

  if (options?.featured) {
    query = query.gte('score', 60)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching public ideas:', error)
    return []
  }

  return data || []
}

export async function getPublicIdeaById(id: string): Promise<PublicIdea | null> {
	const { data, error } = await supabaseAdmin
		.from('public_ideas')
		.select('*')
		.eq('id', id)
		.single()

	if (error) {
		console.error('Error fetching public idea:', error)
		return null
	}

	return data
}
