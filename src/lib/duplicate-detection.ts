import { supabaseAdmin } from './supabase'
import { getProviderManager } from './provider-config'

const KEYWORD_THRESHOLD = 0.25
const SEMANTIC_THRESHOLD = 0.96
const MAX_CANDIDATES = 10

export interface DuplicateCheckResult {
  isDuplicate: boolean
  similarity: number
  similarIdea?: string
  similarIdeaId?: string
}

interface LLMSimilarityResponse {
  similarity: number
  reasoning: string
}

function normalizeIdea(idea: string): string {
  return idea
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function calculateJaccardSimilarity(idea1: string, idea2: string): number {
  const words1 = new Set(idea1.split(' '))
  const words2 = new Set(idea2.split(' '))
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  return union.size === 0 ? 0 : intersection.size / union.size
}

async function getLLMSimilarity(existingIdea: string, newIdea: string): Promise<LLMSimilarityResponse> {
  const providerManager = getProviderManager()
  
  const prompt = `Compare these two startup ideas and return a similarity score from 0.0 to 1.0.

Idea 1: ${existingIdea}

Idea 2: ${newIdea}

Consider: problem, solution, target market, business model.

Return JSON only, no markdown:
{ "similarity": 0.0-1.0, "reasoning": "explanation" }`

  try {
    const result = await providerManager.execute({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      maxTokens: 500,
    })

    const content = result.content.trim()
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[DuplicateDetection] No JSON found in LLM response:', content)
      return { similarity: 0, reasoning: 'Failed to parse LLM response' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    const similarity = Math.max(0, Math.min(1, parseFloat(parsed.similarity) || 0))
    
    return {
      similarity,
      reasoning: parsed.reasoning || 'No reasoning provided'
    }
  } catch (error) {
    console.error('[DuplicateDetection] LLM similarity check failed:', error)
    return { similarity: 0, reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

export async function checkForDuplicates(idea: string): Promise<DuplicateCheckResult> {
  const normalizedNew = normalizeIdea(idea)
  
  try {
    const { data: existingIdeas, error } = await supabaseAdmin
      .from('public_ideas')
      .select('id, title, one_liner')
      .eq('status', 'approved')

    if (error) {
      console.error('[DuplicateDetection] Database query error:', error)
      return { isDuplicate: false, similarity: 0 }
    }

    if (!existingIdeas || existingIdeas.length === 0) {
      return { isDuplicate: false, similarity: 0 }
    }

    const candidates: Array<{ id: string; idea: string; jaccard: number }> = []
    
    for (const existing of existingIdeas) {
      const existingText = `${existing.title} ${existing.one_liner}`
      const normalizedExisting = normalizeIdea(existingText)
      const jaccard = calculateJaccardSimilarity(normalizedNew, normalizedExisting)
      
      if (jaccard >= KEYWORD_THRESHOLD) {
        candidates.push({
          id: existing.id,
          idea: existingText,
          jaccard
        })
      }
    }

    if (candidates.length === 0) {
      return { isDuplicate: false, similarity: 0 }
    }

    candidates.sort((a, b) => b.jaccard - a.jaccard)
    const topCandidates = candidates.slice(0, MAX_CANDIDATES)

    for (const candidate of topCandidates) {
      const llmResult = await getLLMSimilarity(candidate.idea, idea)
      
      console.log(`[DuplicateDetection] LLM similarity: ${llmResult.similarity.toFixed(3)} (Jaccard: ${candidate.jaccard.toFixed(3)})`)
      console.log(`[DuplicateDetection] Reasoning: ${llmResult.reasoning}`)
      
      if (llmResult.similarity >= SEMANTIC_THRESHOLD) {
        return {
          isDuplicate: true,
          similarity: llmResult.similarity,
          similarIdea: candidate.idea,
          similarIdeaId: candidate.id
        }
      }
    }

    const maxJaccard = Math.max(...candidates.map(c => c.jaccard))
    return {
      isDuplicate: false,
      similarity: maxJaccard
    }
  } catch (error) {
    console.error('[DuplicateDetection] Unexpected error:', error)
    return { isDuplicate: false, similarity: 0 }
  }
}
