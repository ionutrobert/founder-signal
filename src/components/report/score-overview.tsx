import { ScoreCard } from './score-card'

export const SECTION_LABELS: Record<string, string> = {
  ideaSummary: 'Idea',
  problemClarity: 'Problem',
  targetAudience: 'Audience',
  marketInsight: 'Market',
  positioning: 'Positioning',
  risks: 'Risks',
  mvpScope: 'MVP Scope',
  goToMarket: 'Go-to-Market',
  whyNow: 'Why Now',
  overall: 'Overall',
}

interface ScoreOverviewProps {
  scores: Partial<Record<keyof typeof SECTION_LABELS, number>>
  summaries?: Partial<Record<keyof typeof SECTION_LABELS, string>>
  resultId?: string
  className?: string
}

const DISPLAY_ORDER: (keyof typeof SECTION_LABELS)[] = [
  'overall',
  'ideaSummary',
  'problemClarity',
  'targetAudience',
  'marketInsight',
  'positioning',
  'risks',
  'mvpScope',
  'goToMarket',
  'whyNow',
]

export function ScoreOverview({
  scores,
  summaries,
  resultId,
  className,
}: ScoreOverviewProps) {
  const sections = DISPLAY_ORDER.filter((key) => scores[key] !== undefined)

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {sections.map((key) => {
          const score = scores[key]
          if (score === undefined) return null

          const label = SECTION_LABELS[key] ?? key
          const summary = summaries?.[key]
          const href = resultId ? `/result/${key}?id=${resultId}` : undefined

          return (
            <ScoreCard
              key={key}
              title={label}
              score={score}
              summary={summary}
              href={href}
            />
          )
        })}
      </div>
    </div>
  )
}
