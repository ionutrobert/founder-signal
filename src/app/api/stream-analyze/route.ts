import { NextResponse } from 'next/server'

import { parseValidationReport } from '@/lib/json-parser'
import { streamIdeaAnalysis } from '@/lib/nim-client'
import type {
  APIError,
  StreamAnalyzeEvent,
  ValidationReport,
  ValidationSectionName,
  ValidationSections,
  Verdict
} from '@/types/validation'

const MAX_IDEA_LENGTH = 10000
const MIN_IDEA_LENGTH = 10

const sectionProgressMap: Record<ValidationSectionName, number> = {
  ideaSummary: 10,
  problemClarity: 24,
  targetAudience: 36,
  marketInsight: 50,
  competition: 64,
  positioning: 76,
  mvpScope: 86,
  monetization: 94,
  risks: 98
}

interface AnalyzeRequest {
  idea?: string
}

type ModelStreamLine =
  | {
      type: 'section'
      name: ValidationSectionName
      data: unknown
    }
  | {
      type: 'score'
      value: number
    }
  | {
      type: 'verdict'
      value: Verdict
    }

function createErrorResponse(code: string, message: string, status: number) {
  const error: APIError = {
    code,
    message,
    details: []
  }

  return NextResponse.json({ success: false, error }, { status })
}

function isSectionName(value: string): value is ValidationSectionName {
  return value in sectionProgressMap
}

function isVerdict(value: unknown): value is Verdict {
  return value === 'pass' || value === 'fail' || value === 'needs-work'
}

function parseModelStreamLine(line: string): ModelStreamLine | null {
  try {
    const parsed = JSON.parse(line) as Partial<ModelStreamLine> & {
      name?: string
      value?: unknown
    }

    if (parsed.type === 'section' && parsed.name && isSectionName(parsed.name)) {
      return {
        type: 'section',
        name: parsed.name,
        data: parsed.data
      }
    }

    if (parsed.type === 'score' && typeof parsed.value === 'number') {
      return {
        type: 'score',
        value: Math.max(0, Math.min(100, Math.round(parsed.value)))
      }
    }

    if (parsed.type === 'verdict' && isVerdict(parsed.value)) {
      return {
        type: 'verdict',
        value: parsed.value
      }
    }
  } catch {}

  return null
}

function buildReport(
  sections: Partial<ValidationSections>,
  score: number | null,
  verdict: Verdict | null
): ValidationReport | null {
  if (score === null || verdict === null) {
    return null
  }

  return parseValidationReport(
    JSON.stringify({
      ...sections,
      score,
      verdict
    })
  )
}

function formatStageLabel(name: ValidationSectionName) {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase())
}

function writeSseChunk(writer: WritableStreamDefaultWriter<Uint8Array>, data: StreamAnalyzeEvent) {
  const encoder = new TextEncoder()
  return writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
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

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const sections: Partial<ValidationSections> = {}

  void (async () => {
    let modelBuffer = ''
    let score: number | null = null
    let verdict: Verdict | null = null

    try {
      await writeSseChunk(writer, {
        type: 'status',
        stage: 'connecting',
        message: 'Connecting to NVIDIA NIM'
      })

      await writeSseChunk(writer, {
        type: 'score',
        value: 0
      })

      await streamIdeaAnalysis(trimmedIdea, async (token) => {
        modelBuffer += token

        let newlineIndex = modelBuffer.indexOf('\n')

        while (newlineIndex !== -1) {
          const rawLine = modelBuffer.slice(0, newlineIndex).trim()
          modelBuffer = modelBuffer.slice(newlineIndex + 1)

          if (rawLine) {
            const parsedLine = parseModelStreamLine(rawLine)

            if (parsedLine?.type === 'section') {
              ;(sections as Record<ValidationSectionName, unknown>)[parsedLine.name] = parsedLine.data

              await writeSseChunk(writer, {
                type: 'status',
                stage: 'streaming',
                message: `Streaming ${formatStageLabel(parsedLine.name)}`
              })

              await writeSseChunk(writer, {
                type: 'score',
                value: sectionProgressMap[parsedLine.name]
              })

              await writeSseChunk(writer, {
                type: 'section',
                name: parsedLine.name,
                data: parsedLine.data as ValidationReport[typeof parsedLine.name]
              } as StreamAnalyzeEvent)
            }

            if (parsedLine?.type === 'score') {
              score = parsedLine.value

              await writeSseChunk(writer, {
                type: 'score',
                value: parsedLine.value
              })
            }

            if (parsedLine?.type === 'verdict') {
              verdict = parsedLine.value
            }
          }

          newlineIndex = modelBuffer.indexOf('\n')
        }
      })

      if (modelBuffer.trim()) {
        const trailingLine = parseModelStreamLine(modelBuffer.trim())

        if (trailingLine?.type === 'score') {
          score = trailingLine.value
          await writeSseChunk(writer, { type: 'score', value: trailingLine.value })
        }

        if (trailingLine?.type === 'verdict') {
          verdict = trailingLine.value
        }

        if (trailingLine?.type === 'section') {
          ;(sections as Record<ValidationSectionName, unknown>)[trailingLine.name] = trailingLine.data

          await writeSseChunk(writer, {
            type: 'section',
            name: trailingLine.name,
            data: trailingLine.data as ValidationReport[typeof trailingLine.name]
          } as StreamAnalyzeEvent)
        }
      }

      await writeSseChunk(writer, {
        type: 'status',
        stage: 'assembling',
        message: 'Assembling final report'
      })

      const report = buildReport(sections, score, verdict)

      if (!report) {
        throw new Error('Failed to assemble a complete validation report from the stream.')
      }

      await writeSseChunk(writer, {
        type: 'score',
        value: report.score
      })

      await writeSseChunk(writer, {
        type: 'status',
        stage: 'complete',
        message: 'Analysis complete'
      })

      await writeSseChunk(writer, {
        type: 'complete',
        data: report
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected streaming error occurred.'

      await writeSseChunk(writer, {
        type: 'error',
        message,
        recoverable: true
      })
    } finally {
      await writer.close()
    }
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
