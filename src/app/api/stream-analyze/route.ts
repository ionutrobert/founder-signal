import { NextResponse } from 'next/server'

import { orchestrate3PhaseValidation } from '@/lib/orchestrator'
import { createRequestContext, runWithContext } from '@/lib/request-context'
import { storeResult } from '@/lib/result-store'
import { checkDailyLimit, incrementDailyUsage, getFingerprint } from '@/lib/daily-rate-limit'
import { checkForDuplicates } from '@/lib/duplicate-detection'
import { createPublicIdea } from '@/lib/public-ideas'
import type {
APIError,
StreamAnalyzeEvent,
ValidationReport,
ValidationSectionName,
ValidationResult
} from '@/types/validation'
import type { PhaseProgressEvent } from '@/lib/orchestrator'

const MAX_IDEA_LENGTH = 10000
const MIN_IDEA_LENGTH = 10

interface AnalyzeRequest {
	idea?: string
	isPublic?: boolean
}

function createErrorResponse(code: string, message: string, status: number) {
  const error: APIError = {
    code,
    message,
    details: []
  }

  return NextResponse.json({ success: false, error }, { status })
}

function writeSseChunk(writer: WritableStreamDefaultWriter<Uint8Array>, data: StreamAnalyzeEvent) {
  const encoder = new TextEncoder()
  return writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
}

function writeSseFlush(writer: WritableStreamDefaultWriter<Uint8Array>) {
  const encoder = new TextEncoder()
  return writer.write(encoder.encode(`: flush\n\n`))
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

	const { idea, isPublic = true } = body as AnalyzeRequest

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

const duplicateCheck = await checkForDuplicates(trimmedIdea)
if (duplicateCheck.isDuplicate) {
return createErrorResponse(
'DUPLICATE_IDEA',
`This idea appears very similar to one recently analyzed. Please provide a more unique idea.`,
409
)
}

const fingerprint = getFingerprint(request)
const { allowed, resetAt } = checkDailyLimit(fingerprint)

if (!allowed) {
const hoursUntilReset = Math.ceil((resetAt - Date.now()) / (60 * 60 * 1000))
return createErrorResponse(
'RATE_LIMIT_EXCEEDED',
`Daily limit reached. You've already analyzed an idea today. Please try again in ${hoursUntilReset} hours.`,
429
)
}

const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const abortController = new AbortController()

  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    abortController.abort()
  })

  void (async () => {
    const context = createRequestContext(trimmedIdea)
    let phaseCompleted = false
    let timeoutShown = false
    let hasError = false

    // Set up timeout notification - only show if truly stalled (90s+)
    const timeoutId = setTimeout(() => {
      if (!phaseCompleted && !timeoutShown && !hasError) {
        timeoutShown = true
        void writeSseChunk(writer, {
          type: 'status',
          stage: 'streaming',
          message: 'We\'re experiencing high demand at the moment. Your request is still being processed - thank you for your patience!'
        })
      }
    }, 90000) // 90s instead of 30s

    runWithContext(context, async () => {
      try {
        await writeSseChunk(writer, {
          type: 'status',
          stage: 'connecting',
          message: 'Starting 3-phase validation'
        })

  await writeSseChunk(writer, {
    type: 'score',
    value: 0
  })

  const onProgress = async (event: PhaseProgressEvent) => {
    if (event.status === 'starting') {
      await writeSseChunk(writer, {
        type: 'status',
        stage: 'connecting',
        message: event.message || `Starting ${event.phase} phase`
      })
  } else if (event.status === 'streaming') {
    // Check if this is a phase event (special message pattern)
    if (event.message === 'phase:starting') {
      await writeSseChunk(writer, {
        type: 'phase',
        phase: event.phase as 'RESEARCH' | 'STRUCTURAL' | 'STRATEGIC',
        status: 'starting'
      })
      await writeSseFlush(writer)
    } else if (event.message?.startsWith('section:complete:')) {
      // Section complete notification - just log it
      console.log('[stream-analyze] Section complete:', event.message)
    } else if (event.message && !event.message.startsWith('phase:') && !event.message.startsWith('section:')) {
      // Regular activity message
      await writeSseChunk(writer, {
        type: 'activity',
        phase: event.phase,
        message: event.message
      })
      await writeSseFlush(writer)
    }
    
    // Handle sections in streaming status
    if (event.sections) {
      for (const [sectionName, sectionData] of Object.entries(event.sections)) {
        if (sectionData) {
          console.log('[stream-analyze] Emitting section:', sectionName)
          await writeSseChunk(writer, {
            type: 'section',
            name: sectionName as ValidationSectionName,
            data: sectionData
          } as StreamAnalyzeEvent)
          await writeSseFlush(writer)
        }
      }
    }
      } else if (event.status === 'complete') {
        // Emit section scores
        if (event.sectionScores) {
          for (const sectionScore of event.sectionScores) {
            await writeSseChunk(writer, {
              type: 'sectionScore',
              section: sectionScore.section,
              score: sectionScore.score
            })
            await writeSseFlush(writer)
          }

          // Calculate incremental score from section scores
          const totalWeight = event.sectionScores.reduce((sum, s) => sum + (s.weight || 0), 0)
          const weightedScore = event.sectionScores.reduce((sum, s) => sum + (s.score * (s.weight || 0)), 0)
          if (totalWeight > 0) {
            const progressScore = Math.round((weightedScore / totalWeight) * (event.phase === 'STRUCTURAL' ? 0.6 : 1.0))
            await writeSseChunk(writer, {
              type: 'score',
              value: Math.min(progressScore, 100)
            })
            await writeSseFlush(writer)
          }
        }

        // Emit phase complete event
        if (event.message?.includes('phase completed')) {
          await writeSseChunk(writer, {
            type: 'phase',
            phase: event.phase as 'RESEARCH' | 'STRUCTURAL' | 'STRATEGIC',
            status: 'complete'
          })
          await writeSseFlush(writer)
        }

        await writeSseChunk(writer, {
          type: 'status',
          stage: 'streaming',
          message: event.message || `Completed ${event.phase} phase`
        })

        // Handle sections if present
        if (event.sections) {
          for (const [sectionName, sectionData] of Object.entries(event.sections)) {
            if (sectionData) {
              await writeSseChunk(writer, {
                type: 'section',
                name: sectionName as ValidationSectionName,
                data: sectionData
              } as StreamAnalyzeEvent)
              await writeSseFlush(writer)
            }
          }
        }

        // Emit final score from strategic phase
        if (event.phase === 'STRATEGIC' && event.finalScore !== undefined) {
          await writeSseChunk(writer, {
            type: 'score',
            value: event.finalScore
          })
          await writeSseFlush(writer)
        }
      } else if (event.status === 'failed') {
      await writeSseChunk(writer, {
        type: 'status',
        stage: 'streaming',
        message: event.message || `${event.phase} phase failed`
      })
    }
  }

        const result = await orchestrate3PhaseValidation(trimmedIdea, onProgress, abortController.signal)

        phaseCompleted = true

        if (result && typeof result === 'object' && 'score' in result) {
          const validationResult = result as ValidationResult
          
          await writeSseChunk(writer, {
            type: 'status',
            stage: 'assembling',
            message: 'Assembling final report'
          })
          await writeSseFlush(writer)

          await writeSseChunk(writer, {
            type: 'score',
            value: result.score
          })
          await writeSseFlush(writer)

          await writeSseChunk(writer, {
            type: 'status',
            stage: 'complete',
            message: 'Analysis complete'
          })
          await writeSseFlush(writer)

          // Log any phase failures for debugging
          if (validationResult.partialFailures?.length) {
            console.log('[stream-analyze] Phase failures:', validationResult.partialFailures)
          }
          
		const resultId = await storeResult(result as ValidationReport, {
			partialFailures: validationResult.partialFailures,
			phases: validationResult.phases,
			isPublic
		})

		// Save to Supabase public_ideas only if public
		if (isPublic && result.ideaSummary) {
			await createPublicIdea({
				id: resultId,
				title: result.ideaSummary.title || 'Untitled Idea',
				one_liner: result.ideaSummary.oneLiner || '',
				category: result.ideaSummary.category || 'General',
				score: result.score,
				verdict: result.verdict
			})
		}

incrementDailyUsage(fingerprint)

        await writeSseChunk(writer, {
type: 'complete',
data: {
...result,
phases: validationResult.phases
} as ValidationReport,
resultId
})
await writeSseFlush(writer)
}
  } catch (error) {
    hasError = true
    const message = error instanceof Error ? error.message : 'An unexpected streaming error occurred.'

    try {
      await writeSseChunk(writer, {
        type: 'error',
        message,
        recoverable: true
      })
    } catch {
      // Writer might be closed already
    }
  } finally {
    clearTimeout(timeoutId)
    try {
      await writer.close()
    } catch {
      // Stream might already be closed
    }
  }
    })
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
