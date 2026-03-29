import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { ValidationReport, Verdict } from '@/types/validation'

const verdictMessages: Record<Verdict, { action: string; color: string }> = {
  pass: {
    action: 'Yes, pursue this idea',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  'needs-work': {
    action: 'Conditional - needs refinement',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  fail: {
    action: 'No, significant issues',
    color: 'bg-red-50 text-red-700 border-red-200',
  },
}

interface SimplifiedReportProps {
  report: ValidationReport
}

export function SimplifiedReport({ report }: SimplifiedReportProps) {
  const verdictInfo = verdictMessages[report.verdict]

  const topStrengths = [
    report.positioning.uniqueValueProposition,
    report.ideaSummary.problemTheme,
    report.mvpScope.timeline,
  ].filter(Boolean).slice(0, 3)

  const topWeaknesses = [
    report.risks.technical?.[0],
    report.risks.market?.[0],
  ].filter(Boolean).slice(0, 3)

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Should you build this?
            </p>
            <Badge className={cn('mt-2 text-base', verdictInfo.color)}>
              {verdictInfo.action}
            </Badge>
          </div>
          
          <p className="text-sm leading-6 text-slate-600">
            Based on our analysis, this idea scores {report.score}/100. 
            {report.verdict === 'pass' && ' The fundamentals are strong and worth pursuing.'}
            {report.verdict === 'needs-work' && " There's potential, but key areas need refinement before execution."}
            {report.verdict === 'fail' && ' Significant issues make this idea risky to pursue without major changes.'}
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
        <CardContent className="space-y-3 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Top Strengths
          </h3>
          <ul className="space-y-2">
            {topStrengths.map((strength) => (
              <li key={strength.slice(0, 30)} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {strength}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
        <CardContent className="space-y-3 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">
            Key Challenges
          </h3>
          <ul className="space-y-2">
            {topWeaknesses.length > 0 ? (
              topWeaknesses.map((weakness) => (
                <li key={weakness.slice(0, 30)} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {weakness}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No major challenges identified.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
        <CardContent className="space-y-3 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            What to do next
          </h3>
          <ol className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">1.</span>
              Validate demand with {report.targetAudience.keySegments?.[0] || 'potential customers'}
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">2.</span>
              Build MVP focusing on {report.mvpScope.coreFeatures?.[0] || 'core functionality'}
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">3.</span>
              Address {report.risks.market?.[0] || 'market risks'} early
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
