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
    if (typeof section.score === 'object' && section.score !== null) {
      const scoreObj = section.score as Record<string, unknown>
      section.score = validateScore(scoreObj.score ?? scoreObj.value)
      if (scoreObj.reasoning && typeof scoreObj.reasoning === 'string') {
        section.scoreReasoning = scoreObj.reasoning
      }
    } else {
      section.score = validateScore(section.score)
    }
  }
  if ('assessment' in section && typeof section.assessment === 'object') {
    const assessment = section.assessment as Record<string, unknown>
    if (assessment.score !== undefined) {
      section.score = validateScore(assessment.score)
    }
    if (assessment.reasoning && typeof assessment.reasoning === 'string') {
      section.scoreReasoning = assessment.reasoning
    }
    delete section.assessment
  }
  if ('summary' in section && typeof section.summary !== 'string') {
    delete section.summary
  }
  if ('scoreReasoning' in section && typeof section.scoreReasoning !== 'string') {
    if (typeof section.scoreReasoning === 'object' && section.scoreReasoning !== null) {
      const reasoningObj = section.scoreReasoning as Record<string, unknown>
      section.scoreReasoning = typeof reasoningObj.reasoning === 'string' ? reasoningObj.reasoning : undefined
    }
    if (typeof section.scoreReasoning !== 'string') {
      delete section.scoreReasoning
    }
  }
  return section
}

function extractStringValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    if ('assessment' in obj && typeof obj.assessment === 'string') return obj.assessment
    if ('value' in obj) return extractStringValue(obj.value)
    return ''
  }
  return String(value)
}

function normalizeWhyNow(section: Record<string, unknown>): Record<string, unknown> {
  section = normalizeSection(section)
  if (!Array.isArray(section.marketForces)) {
    section.marketForces = []
  }
  if (!Array.isArray(section.enablingTechnology)) {
    section.enablingTechnology = []
  }
  if (!Array.isArray(section.culturalShift)) {
    section.culturalShift = []
  }
  if (typeof section.timing !== 'string') {
    section.timing = extractStringValue(section.timing) || 'Market timing assessment pending'
  }
  return section
}

function normalizeMarketInsight(section: Record<string, unknown>): Record<string, unknown> {
  section = normalizeSection(section)
  if (section.marketGrowthRate !== undefined && typeof section.marketGrowthRate !== 'string') {
    delete section.marketGrowthRate
  }
  if (
    section.marketMaturity !== undefined &&
    !['emerging', 'growing', 'mature', 'declining'].includes(section.marketMaturity as string)
  ) {
    delete section.marketMaturity
  }
  if (section.keyMetrics !== undefined && !Array.isArray(section.keyMetrics)) {
    delete section.keyMetrics
  }
  return section
}

function normalizeCompetition(section: Record<string, unknown>): Record<string, unknown> {
  section = normalizeSection(section)
  if (section.marketShareEstimate !== undefined && typeof section.marketShareEstimate !== 'string') {
    delete section.marketShareEstimate
  }
  if (
    section.competitiveIntensity !== undefined &&
    !['low', 'medium', 'high'].includes(section.competitiveIntensity as string)
  ) {
    delete section.competitiveIntensity
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
  report.marketInsight = normalizeMarketInsight(report.marketInsight as Record<string, unknown>)
  report.competition = normalizeCompetition(report.competition as Record<string, unknown>)
  report.positioning = normalizeSection(report.positioning as Record<string, unknown>)
  report.mvpScope = normalizeSection(report.mvpScope as Record<string, unknown>)
  report.monetization = normalizeSection(report.monetization as Record<string, unknown>)
  report.risks = normalizeSection(report.risks as Record<string, unknown>)

  if (report.whyNow && typeof report.whyNow === 'object') {
    report.whyNow = normalizeWhyNow(report.whyNow as Record<string, unknown>)
  } else {
    report.whyNow = {
      timing: 'Market timing assessment pending',
      marketForces: [],
      enablingTechnology: [],
      culturalShift: [],
    }
  }

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
