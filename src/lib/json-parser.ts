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

function validateScore(value: unknown): number | undefined {
  if (typeof value !== 'number') return undefined
  return Math.max(0, Math.min(100, Math.round(value)))
}

function validateVerdict(value: unknown): value is Verdict {
  return typeof value === 'string' && ['pass', 'fail', 'needs-work'].includes(value)
}

function normalizeSection(section: Record<string, unknown>): Record<string, unknown> {
  if (typeof section !== 'object' || section === null) return section
  if ('score' in section) {
    section.score = validateScore(section.score)
  }
  return section
}

function validateReport(obj: unknown): obj is ValidationReport {
  if (typeof obj !== 'object' || obj === null) return false
  const report = obj as Record<string, unknown>

  if (
    typeof report.ideaSummary !== 'object' ||
    typeof report.problemClarity !== 'object' ||
    typeof report.targetAudience !== 'object' ||
    typeof report.marketInsight !== 'object' ||
    typeof report.competition !== 'object' ||
    typeof report.positioning !== 'object' ||
    typeof report.mvpScope !== 'object' ||
    typeof report.monetization !== 'object' ||
    typeof report.risks !== 'object'
  ) {
    return false
  }

  report.ideaSummary = normalizeSection(report.ideaSummary as Record<string, unknown>)
  report.problemClarity = normalizeSection(report.problemClarity as Record<string, unknown>)
  report.targetAudience = normalizeSection(report.targetAudience as Record<string, unknown>)
  report.marketInsight = normalizeSection(report.marketInsight as Record<string, unknown>)
  report.competition = normalizeSection(report.competition as Record<string, unknown>)
  report.positioning = normalizeSection(report.positioning as Record<string, unknown>)
  report.mvpScope = normalizeSection(report.mvpScope as Record<string, unknown>)
  report.monetization = normalizeSection(report.monetization as Record<string, unknown>)
  report.risks = normalizeSection(report.risks as Record<string, unknown>)

  const score = validateScore(report.score)
  if (score === undefined) return false
  report.score = score

  if (!validateVerdict(report.verdict)) return false

  return true
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
