'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ValidationResult, Verdict } from '@/types/validation'

interface ComparisonTableProps {
  results: ValidationResult[]
}

const verdictColors: Record<Verdict, string> = {
  pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'needs-work': 'bg-amber-50 text-amber-700 border-amber-200',
  fail: 'bg-red-50 text-red-700 border-red-200',
}

const sections = [
  { key: 'ideaSummary', label: 'Idea Summary' },
  { key: 'problemClarity', label: 'Problem Clarity' },
  { key: 'targetAudience', label: 'Target Audience' },
  { key: 'marketInsight', label: 'Market Insight' },
  { key: 'competition', label: 'Competition' },
  { key: 'positioning', label: 'Positioning' },
  { key: 'mvpScope', label: 'MVP Scope' },
  { key: 'monetization', label: 'Monetization' },
  { key: 'risks', label: 'Risks' },
] as const

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 65) return 'text-emerald-500'
  if (score >= 50) return 'text-slate-600'
  if (score >= 35) return 'text-amber-600'
  return 'text-red-600'
}

export function ComparisonTable({ results }: ComparisonTableProps) {
  if (results.length === 0) {
    return <p className="text-slate-500">No results to compare.</p>
  }

  return (
    <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">Score Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left font-medium text-slate-500">Section</th>
                {results.map((result) => (
                  <th key={result.ideaSummary.title.slice(0, 30)} className="px-4 py-3 text-center font-medium text-slate-900">
                    <div className="space-y-1">
                      <div className="truncate max-w-[150px]">{result.ideaSummary.title}</div>
                      <Badge className={verdictColors[result.verdict]}>
                        {result.score}/100
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map(({ key, label }) => (
                <tr key={key} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-600">{label}</td>
                  {results.map((result) => {
                    const sectionData = result[key] as { score?: number } | undefined
                    const score = sectionData?.score
                    const resultKey = result.ideaSummary.title.slice(0, 20)
                    return (
                      <td key={`${key}-${resultKey}`} className="px-4 py-3 text-center">
                        {score !== undefined ? (
                          <span className={`font-semibold ${getScoreColor(score)}`}>
                            {score}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
