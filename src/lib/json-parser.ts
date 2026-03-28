import type { ValidationReport, Verdict } from '../types/validation'

const MARKDOWN_BLOCK_REGEX = /^```(?:json)?\s*\n?|\n?\s*```$/g

function cleanJsonString(input: string): string {
  return input.replace(MARKDOWN_BLOCK_REGEX, '').trim()
}

function extractJsonObject(input: string): string {
  const firstBrace = input.indexOf('{')
  const lastBrace = input.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) return input
  return input.slice(firstBrace, lastBrace + 1)
}

function validateScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100
}

function validateVerdict(value: unknown): value is Verdict {
  return typeof value === 'string' && ['pass', 'fail', 'needs-work'].includes(value)
}

function validateReport(obj: unknown): obj is ValidationReport {
  if (typeof obj !== 'object' || obj === null) return false
  const report = obj as Record<string, unknown>
  return (
    typeof report.ideaSummary === 'object' &&
    typeof report.problemClarity === 'object' &&
    typeof report.targetAudience === 'object' &&
    typeof report.marketInsight === 'object' &&
    typeof report.competition === 'object' &&
    typeof report.positioning === 'object' &&
    typeof report.mvpScope === 'object' &&
    typeof report.monetization === 'object' &&
    typeof report.risks === 'object' &&
    validateScore(report.score) &&
    validateVerdict(report.verdict)
  )
}

export function parseValidationReport(jsonString: string): ValidationReport | null {
  const cleaned = cleanJsonString(jsonString)
  const extracted = extractJsonObject(cleaned)

  try {
    const parsed = JSON.parse(extracted)
    if (validateReport(parsed)) return parsed
  } catch {}

  try {
    const cleaned2 = cleanJsonString(extracted)
    const parsed2 = JSON.parse(cleaned2)
    if (validateReport(parsed2)) return parsed2
  } catch {}

  return null
}
