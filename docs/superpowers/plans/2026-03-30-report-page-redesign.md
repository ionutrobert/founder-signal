# Report Page Redesign - Implementation Plan

> **For agentic workers:** Execute all phases in parallel using subagents. This is a comprehensive redesign that touches types, prompts, components, and pages.

**Goal:** Transform the report page into an ideabrowser.com-inspired comprehensive report experience.

**Architecture:** Two-column layout, score overview grid, framework visualizations, detail pages, Why Now section.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, NVIDIA NIM API

---

## Phase 1: Types & Prompts

### Task 1.1: Add WhyNow Interface to Types

**Files:**
- Modify: `src/types/validation.ts`

- [ ] **Step 1: Add WhyNow interface**
```typescript
export interface WhyNow {
  timing: string // Why is now the right time?
  marketForces: string[] // What trends/drivers make this urgent?
  enablingTechnology: string // What tech enables this?
  culturalShift: string // What behavior changed?
  score?: number
  scoreReasoning?: string
}
```

- [ ] **Step 2: Add WhyNow to ValidationReport interface**
```typescript
export interface ValidationReport {
  ideaSummary: IdeaSummary
  problemClarity: ProblemClarity
  targetAudience: TargetAudience
  marketInsight: MarketInsight
  competition: Competition
  positioning: Positioning
  mvpScope: MVPScope
  monetization: Monetization
  risks: Risks
  whyNow: WhyNow // NEW
  score: Score
  verdict: Verdict
}
```

- [ ] **Step 3: Update validationSectionOrder**
```typescript
export const validationSectionOrder = [
  'ideaSummary',
  'whyNow', // NEW - after ideaSummary
  'problemClarity',
  'targetAudience',
  'marketInsight',
  'competition',
  'positioning',
  'mvpScope',
  'monetization',
  'risks'
] as const
```

- [ ] **Step 4: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**
```bash
git add src/types/validation.ts
git commit -m "feat: add WhyNow interface and section to validation types"
```

---

### Task 1.2: Add Summary Fields to Section Interfaces

**Files:**
- Modify: `src/types/validation.ts`

- [ ] **Step 1: Add summary field to each section interface**
Add `summary?: string` to:
- IdeaSummary
- ProblemClarity
- TargetAudience
- MarketInsight
- Competition
- Positioning
- MVPScope
- Monetization
- Risks
- WhyNow

Example:
```typescript
export interface ProblemClarity {
  problemStatement: string
  severity: 'critical' | 'moderate' | 'low'
  affectedUsers: string
  evidence: string[]
  confidenceLevel: string
  summary?: string // NEW - 1-2 sentence summary for cards
  score?: number
  scoreReasoning?: string
}
```

- [ ] **Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**
```bash
git add src/types/validation.ts
git commit -m "feat: add summary field to all section interfaces"
```

---

### Task 1.3: Enhance MarketInsight Interface

**Files:**
- Modify: `src/types/validation.ts`

- [ ] **Step 1: Add enhanced fields to MarketInsight**
```typescript
export interface MarketInsight {
  tam: string
  sam: string
  som: string
  trends: string[]
  growthSignals: string[]
  marketGrowthRate?: string // NEW - "20.5% CAGR"
  marketMaturity?: 'emerging' | 'growing' | 'mature' | 'declining' // NEW
  keyMetrics?: { // NEW
    name: string
    value: string
    trend: 'up' | 'down' | 'stable'
  }[]
  summary?: string
  score?: number
  scoreReasoning?: string
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/types/validation.ts
git commit -m "feat: add growth rate and key metrics to MarketInsight"
```

---

### Task 1.4: Enhance Competition Interface

**Files:**
- Modify: `src/types/validation.ts`

- [ ] **Step 1: Add enhanced fields to Competition**
```typescript
export interface Competition {
  directCompetitors: CompetitorProfile[]
  indirectCompetitors: CompetitorProfile[]
  competitiveAdvantage: string
  marketShareEstimate?: string // NEW - "Fragmented market, top 3 have 40%"
  competitiveIntensity?: 'low' | 'medium' | 'high' // NEW
  summary?: string
  score?: number
  scoreReasoning?: string
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/types/validation.ts
git commit -m "feat: add market share and intensity to Competition"
```

---

### Task 1.5: Update Prompts for WhyNow Section

**Files:**
- Modify: `src/lib/prompts.ts`

- [ ] **Step 1: Add WhyNow to validation prompt schema**
After ideaSummary, add:
```typescript
"whyNow": {
  "timing": "string - Why is now the right time for this idea?",
  "marketForces": ["string - trends, shifts, drivers"],
  "enablingTechnology": "string - what tech makes this possible now?",
  "culturalShift": "string - what behavior changed?",
  "score": number 0-100,
  "scoreReasoning": "string - 1-2 sentences explaining the score"
},
```

- [ ] **Step 2: Add scoring guidelines for WhyNow**
```typescript
// WhyNow scoring: 80+ = Perfect timing (multiple converging trends)
// 65-79 = Good timing (clear momentum)
// 50-64 = Adequate timing (some signals)
// 35-49 = Weak timing (uncertain or too early/late)
// 0-34 = Bad timing (against trends)
```

- [ ] **Step 3: Add summary field instructions**
For all sections, add instruction:
```typescript
"summary": "string - 1-2 sentence summary of this section's key insight"
```

- [ ] **Step 4: Add enhanced MarketInsight fields**
```typescript
"marketGrowthRate": "string - CAGR or growth percentage",
"marketMaturity": "'emerging' | 'growing' | 'mature' | 'declining'",
"keyMetrics": [{"name": "string", "value": "string", "trend": "up|down|stable"}]
```

- [ ] **Step 5: Add enhanced Competition fields**
```typescript
"marketShareEstimate": "string - market concentration description",
"competitiveIntensity": "'low' | 'medium' | 'high'"
```

- [ ] **Step 6: Run TypeScript check**

- [ ] **Step 7: Commit**
```bash
git add src/lib/prompts.ts
git commit -m "feat: add WhyNow section and enhanced fields to validation prompts"
```

---

## Phase 2: Framework Components

### Task 2.1: Create ScoreGauge Component

**Files:**
- Create: `src/components/report/framework/score-gauge.tsx`

- [ ] **Step 1: Create ScoreGauge component**
```typescript
'use client'

import { useEffect, useState } from 'react'

interface ScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  showValue?: boolean
}

const SIZES = {
  sm: { radius: 40, strokeWidth: 6 },
  md: { radius: 50, strokeWidth: 8 },
  lg: { radius: 60, strokeWidth: 10 }
}

export function ScoreGauge({ score, size = 'md', label, showValue = true }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const { radius, strokeWidth } = SIZES[size]
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10b981'
    if (s >= 65) return '#34d399'
    if (s >= 50) return '#64748b'
    if (s >= 35) return '#fbbf24'
    return '#ef4444'
  }

  const getScoreGradient = (s: number) => {
    if (s >= 80) return 'from-emerald-400 to-emerald-600'
    if (s >= 65) return 'from-emerald-300 to-emerald-500'
    if (s >= 50) return 'from-slate-400 to-slate-600'
    if (s >= 35) return 'from-amber-400 to-amber-600'
    return 'from-red-400 to-red-600'
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <svg 
        className="transform -rotate-90"
        width={radius * 2 + strokeWidth * 2}
        height={radius * 2 + strokeWidth * 2}
      >
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke={getScoreColor(animatedScore)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ 
            transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s ease',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{animatedScore}</span>
          {label && <span className="text-xs text-slate-500">{label}</span>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/components/report/framework/score-gauge.tsx
git commit -m "feat: add animated circular ScoreGauge component"
```

---

### Task 2.2: Create ScoreCard Component

**Files:**
- Create: `src/components/report/score-card.tsx`

- [ ] **Step 1: Create ScoreCard component**
```typescript
'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { StrengthLevel } from '@/lib/strength'

interface ScoreCardProps {
  title: string
  score: number
  strength: StrengthLevel
  href?: string
  summary?: string
}

const strengthBorderColors: Record<StrengthLevel, string> = {
  critical: 'border-t-red-500',
  weak: 'border-t-amber-500',
  neutral: 'border-t-slate-400',
  good: 'border-t-emerald-500',
  strong: 'border-t-emerald-600'
}

const strengthBgColors: Record<StrengthLevel, string> = {
  critical: 'bg-red-50',
  weak: 'bg-amber-50',
  neutral: 'bg-white',
  good: 'bg-emerald-50',
  strong: 'bg-emerald-100'
}

export function ScoreCard({ title, score, strength, href, summary }: ScoreCardProps) {
  const content = (
    <div 
      className={cn(
        'group rounded-lg border border-slate-200 bg-white p-4 transition-all hover:shadow-md',
        'border-t-4',
        strengthBorderColors[strength],
        href && 'cursor-pointer hover:border-slate-300'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1 truncate">
            {title}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{score}</span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
        </div>
        {href && (
          <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </div>
      {summary && (
        <p className="mt-2 text-xs text-slate-600 line-clamp-2">{summary}</p>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/components/report/score-card.tsx
git commit -m "feat: add ScoreCard component with strength styling"
```

---

### Task 2.3: Create ScoreOverview Component

**Files:**
- Create: `src/components/report/score-overview.tsx`

- [ ] **Step 1: Create ScoreOverview component**
```typescript
'use client'

import { ScoreCard } from './score-card'
import type { ValidationResult, ValidationSectionName } from '@/types/validation'

interface ScoreOverviewProps {
  report: ValidationResult
  resultId: string
}

const sectionLabels: Record<ValidationSectionName, string> = {
  ideaSummary: 'Idea',
  whyNow: 'Why Now',
  problemClarity: 'Problem',
  targetAudience: 'Audience',
  marketInsight: 'Market',
  competition: 'Competition',
  positioning: 'Positioning',
  mvpScope: 'MVP',
  monetization: 'Monetization',
  risks: 'Risks'
}

function scoreToStrength(score: number): 'critical' | 'weak' | 'neutral' | 'good' | 'strong' {
  if (score >= 80) return 'strong'
  if (score >= 65) return 'good'
  if (score >= 50) return 'neutral'
  if (score >= 35) return 'weak'
  return 'critical'
}

export function ScoreOverview({ report, resultId }: ScoreOverviewProps) {
  const sections = Object.keys(sectionLabels) as ValidationSectionName[]
  
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10">
      {sections.map((section) => {
        const sectionData = report[section] as { score?: number; summary?: string }
        const score = sectionData?.score ?? 50
        const strength = scoreToStrength(score)
        
        return (
          <ScoreCard
            key={section}
            title={sectionLabels[section]}
            score={score}
            strength={strength}
            href={`/result/${section}?id=${resultId}`}
            summary={sectionData?.summary}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/components/report/score-overview.tsx
git commit -m "feat: add ScoreOverview grid component"
```

---

### Task 2.4: Create MarketMatrix Component

**Files:**
- Create: `src/components/report/framework/market-matrix.tsx`

- [ ] **Step 1: Create MarketMatrix component**
```typescript
'use client'

import { useMemo } from 'react'

interface MarketMatrixProps {
  marketSize: 'small' | 'medium' | 'large'
  competitionLevel: 'low' | 'medium' | 'high'
  competitors?: Array<{
    name: string
    size: 'small' | 'medium' | 'large'
    competition: 'low' | 'medium' | 'high'
    type: 'direct' | 'indirect'
  }>
}

const positionMap = {
  small: 25,
  medium: 50,
  large: 75
}

export function MarketMatrix({ marketSize, competitionLevel, competitors = [] }: MarketMatrixProps) {
  const ideaPosition = useMemo(() => ({
    x: positionMap[marketSize],
    y: 100 - positionMap[competitionLevel] // Invert Y
  }), [marketSize, competitionLevel])

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">Competitive Position</h4>
      <div className="relative aspect-square">
        {/* Grid */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Quadrant lines */}
          <line x1="50" y1="0" x2="50" y2="100" stroke="#e2e8f0" strokeWidth="1" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="1" />
          
          {/* Quadrant labels */}
          <text x="25" y="10" fontSize="6" fill="#94a3b8" textAnchor="middle">Low Competition</text>
          <text x="75" y="10" fontSize="6" fill="#94a3b8" textAnchor="middle">High Competition</text>
          <text x="5" y="25" fontSize="6" fill="#94a3b8" textAnchor="start">Small</text>
          <text x="5" y="75" fontSize="6" fill="#94a3b8" textAnchor="start">Large</text>
          <text x="2" y="50" fontSize="5" fill="#94a3b8" textAnchor="start" transform="rotate(-90, 2, 50)">Market Size</text>
          
          {/* Competitors */}
          {competitors.map((comp, i) => (
            <g key={i}>
              <circle
                cx={positionMap[comp.size]}
                cy={100 - positionMap[comp.competition]}
                r="4"
                fill={comp.type === 'direct' ? '#ef4444' : '#fbbf24'}
                opacity="0.6"
              />
              <text
                x={positionMap[comp.size]}
                y={100 - positionMap[comp.competition] - 6}
                fontSize="4"
                fill="#64748b"
                textAnchor="middle"
              >
                {comp.name.slice(0, 10)}
              </text>
            </g>
          ))}
          
          {/* Your Idea */}
          <circle
            cx={ideaPosition.x}
            cy={ideaPosition.y}
            r="6"
            fill="#3b82f6"
            stroke="#1d4ed8"
            strokeWidth="2"
          />
          <text
            x={ideaPosition.x}
            y={ideaPosition.y - 10}
            fontSize="5"
            fill="#1d4ed8"
            textAnchor="middle"
            fontWeight="bold"
          >
            Your Idea
          </text>
        </svg>
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>← Small Market</span>
        <span>Large Market →</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/components/report/framework/market-matrix.tsx
git commit -m "feat: add MarketMatrix 2x2 positioning component"
```

---

### Task 2.5: Create ACPFramework Component

**Files:**
- Create: `src/components/report/framework/acp-framework.tsx`

- [ ] **Step 1: Create ACPFramework component**
```typescript
'use client'

import { cn } from '@/lib/utils'

interface ACPFrameworkProps {
  audience: number // 0-10
  community: number // 0-10
  product: number // 0-10
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-900">{score}/10</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-1000', color)}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  )
}

export function ACPFramework({ audience, community, product }: ACPFrameworkProps) {
  const overall = Math.round((audience + community + product) / 3)
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-slate-900">ACP Framework</h4>
        <span className="text-lg font-bold text-slate-900">{overall}/10</span>
      </div>
      <div className="space-y-3">
        <ScoreBar label="Audience" score={audience} color="bg-blue-500" />
        <ScoreBar label="Community" score={community} color="bg-purple-500" />
        <ScoreBar label="Product" score={product} color="bg-emerald-500" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/components/report/framework/acp-framework.tsx
git commit -m "feat: add ACP Framework horizontal bar component"
```

---

## Phase 3: Sidebar Components

### Task 3.1: Create ActionPanel Component

**Files:**
- Create: `src/components/report/sidebar/action-panel.tsx`

- [ ] **Step 1: Create ActionPanel component**
```typescript
'use client'

import { ShareButtons } from '@/components/share-buttons'
import { Button } from '@/components/ui/button'
import { Download, GitCompare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ActionPanelProps {
  resultId: string
  title: string
}

export function ActionPanel({ resultId, title }: ActionPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">Actions</h4>
      
      <div className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={() => window.print()}
        >
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
        
        <Link href={`/compare?ids=${resultId}`}>
          <Button variant="outline" className="w-full justify-start gap-2">
            <GitCompare className="w-4 h-4" />
            Compare Ideas
          </Button>
        </Link>
      </div>
      
      <div className="pt-2 border-t border-slate-200">
        <ShareButtons resultId={resultId} title={title} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/components/report/sidebar/action-panel.tsx
git commit -m "feat: add ActionPanel sidebar component"
```

---

### Task 3.2: Create QuickStats Component

**Files:**
- Create: `src/components/report/sidebar/quick-stats.tsx`

- [ ] **Step 1: Create QuickStats component**
```typescript
'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { MarketInsight } from '@/types/validation'

interface QuickStatsProps {
  market: MarketInsight
}

export function QuickStats({ market }: QuickStatsProps) {
  const stats = [
    { label: 'TAM', value: market.tam },
    { label: 'SAM', value: market.sam },
    { label: 'SOM', value: market.som },
  ]

  const metrics = market.keyMetrics || []

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">Market Size</h4>
      
      <div className="space-y-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex justify-between items-center">
            <span className="text-xs text-slate-500">{stat.label}</span>
            <span className="text-sm font-semibold text-slate-900">{stat.value}</span>
          </div>
        ))}
      </div>

      {market.marketGrowthRate && (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Growth Rate</span>
            <span className="text-sm font-semibold text-emerald-600">
              {market.marketGrowthRate}
            </span>
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <h5 className="text-xs font-semibold text-slate-700">Key Metrics</h5>
          {metrics.slice(0, 3).map((metric, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{metric.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-900">{metric.value}</span>
                {metric.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                {metric.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                {metric.trend === 'stable' && <Minus className="w-3 h-3 text-slate-400" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/components/report/sidebar/quick-stats.tsx
git commit -m "feat: add QuickStats sidebar component for market metrics"
```

---

## Phase 4: Section Components

### Task 4.1: Create SectionCard Component

**Files:**
- Create: `src/components/report/section-card.tsx`

- [ ] **Step 1: Create SectionCard component**
```typescript
'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import type { StrengthLevel } from '@/lib/strength'

interface SectionCardProps {
  title: string
  score?: number
  strength?: StrengthLevel | null
  children: ReactNode
  detailHref: string
  className?: string
}

const strengthBorderColors: Record<StrengthLevel, string> = {
  critical: 'border-l-red-500',
  weak: 'border-l-amber-500',
  neutral: 'border-l-slate-400',
  good: 'border-l-emerald-500',
  strong: 'border-l-emerald-600'
}

export function SectionCard({ 
  title, 
  score, 
  strength, 
  children, 
  detailHref,
  className 
}: SectionCardProps) {
  return (
    <div 
      className={cn(
        'bg-white rounded-lg border border-slate-200 border-l-4 p-6 transition-shadow hover:shadow-md',
        strength && strengthBorderColors[strength],
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {score !== undefined && (
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-slate-900">{score}</span>
              <span className="text-sm text-slate-500">/100</span>
            </div>
          )}
        </div>
        <Link 
          href={detailHref}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          See details
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="prose prose-sm max-w-none">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/components/report/section-card.tsx
git commit -m "feat: add SectionCard component with detail link"
```

---

### Task 4.2: Create HeroSection Component

**Files:**
- Create: `src/components/report/hero-section.tsx`

- [ ] **Step 1: Create HeroSection component**
```typescript
'use client'

import { Badge } from '@/components/ui/badge'
import { ScoreGauge } from './framework/score-gauge'
import { ShareButtons } from '@/components/share-buttons'
import type { ValidationResult, Verdict } from '@/types/validation'

interface HeroSectionProps {
  report: ValidationResult
  resultId: string
}

const verdictStyles: Record<Verdict, { label: string; className: string }> = {
  pass: { label: 'Pass', className: 'border border-emerald-200 bg-emerald-50 text-emerald-700' },
  'needs-work': { label: 'Needs Work', className: 'border border-amber-200 bg-amber-50 text-amber-700' },
  fail: { label: 'Fail', className: 'border border-red-200 bg-red-50 text-red-700' }
}

export function HeroSection({ report, resultId }: HeroSectionProps) {
  const verdict = verdictStyles[report.verdict]
  
  return (
    <div className="bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 p-8">
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        {/* Left: Title and badges */}
        <div className="flex-1 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600 mb-2">
            Validation Report
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 mb-3">
            {report.ideaSummary.title}
          </h1>
          <p className="text-base lg:text-lg text-slate-600 mb-4 max-w-2xl">
            {report.ideaSummary.oneLiner}
          </p>
          
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
            <Badge className={verdict.className}>{verdict.label}</Badge>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
              {report.ideaSummary.category}
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
              {report.ideaSummary.problemTheme}
            </Badge>
          </div>
          
          <ShareButtons resultId={resultId} title={report.ideaSummary.title} />
        </div>
        
        {/* Right: Score gauge */}
        <div className="flex flex-col items-center gap-3 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <ScoreGauge score={report.score} size="lg" />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">Overall Score</p>
            <p className="text-xs text-slate-500">Founder Signal Confidence</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/components/report/hero-section.tsx
git commit -m "feat: add HeroSection component with score gauge"
```

---

## Phase 5: Detail Pages

### Task 5.1: Create Why Now Detail Page

**Files:**
- Create: `src/app/result/why-now/page.tsx`

- [ ] **Step 1: Create Why Now detail page**
```typescript
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreGauge } from '@/components/report/framework/score-gauge'

function WhyNowContent() {
  const searchParams = useSearchParams()
  const resultId = searchParams.get('id')
  
  // This would fetch the full report and extract whyNow section
  // For now, placeholder with loading state
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href={`/result?id=${resultId}`}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Report
          </Button>
        </Link>
        
        <Card className="border-slate-200 bg-white shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <Badge className="mb-2">Timing Analysis</Badge>
                <CardTitle className="text-2xl">Why Now?</CardTitle>
                <p className="text-slate-600 mt-2">
                  Understanding the timing and momentum behind this idea
                </p>
              </div>
              <ScoreGauge score={78} size="sm" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Sections would be dynamically loaded */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Timing
              </h3>
              <p className="text-slate-700">
                Why now is the right time for this idea...
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Market Forces
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span className="text-slate-700">Trend 1</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Enabling Technology
              </h3>
              <p className="text-slate-700">
                Technology that makes this possible...
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Cultural Shift
              </h3>
              <p className="text-slate-700">
                Behavior changes that support this...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function WhyNowPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WhyNowContent />
    </Suspense>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/app/result/why-now/page.tsx
git commit -m "feat: add Why Now detail page"
```

---

### Task 5.2-5.10: Create Other Detail Pages

Create similar pages for:
- `src/app/result/idea-summary/page.tsx`
- `src/app/result/problem/page.tsx`
- `src/app/result/audience/page.tsx`
- `src/app/result/market/page.tsx`
- `src/app/result/competition/page.tsx`
- `src/app/result/positioning/page.tsx`
- `src/app/result/mvp/page.tsx`
- `src/app/result/monetization/page.tsx`
- `src/app/result/risks/page.tsx`

Each page should:
1. Import necessary components
2. Fetch the report via `?id=xxx` param
3. Extract the relevant section
4. Display full details with back navigation
5. Include ScoreGauge if section has score

- [ ] **Create all 9 remaining detail pages**
- [ ] **Run TypeScript check**
- [ ] **Commit**
```bash
git add src/app/result/*/page.tsx
git commit -m "feat: add detail pages for all sections"
```

---

## Phase 6: Main Report Page Redesign

### Task 6.1: Redesign Result Page

**Files:**
- Modify: `src/app/result/page.tsx`

- [ ] **Step 1: Replace current layout with new design**
Use HeroSection, ScoreOverview, two-column layout with sidebar.

- [ ] **Step 2: Import new components**
```typescript
import { HeroSection } from '@/components/report/hero-section'
import { ScoreOverview } from '@/components/report/score-overview'
import { SectionCard } from '@/components/report/section-card'
import { ActionPanel } from '@/components/report/sidebar/action-panel'
import { QuickStats } from '@/components/report/sidebar/quick-stats'
import { MarketMatrix } from '@/components/report/framework/market-matrix'
import { ACPFramework } from '@/components/report/framework/acp-framework'
```

- [ ] **Step 3: Implement two-column layout**
```typescript
<div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
  {/* Main content */}
  <div className="space-y-6">
    {/* Section cards */}
  </div>
  
  {/* Sidebar */}
  <div className="space-y-4">
    <ActionPanel resultId={resultId} title={report.ideaSummary.title} />
    <QuickStats market={report.marketInsight} />
    {/* Framework visualizations */}
  </div>
</div>
```

- [ ] **Step 4: Remove tabs (ReportTabs)**
Replace with single scrolling page.

- [ ] **Step 5: Remove SimplifiedReport**
The new design makes simplified view unnecessary.

- [ ] **Step 6: Run TypeScript check**

- [ ] **Step 7: Commit**
```bash
git add src/app/result/page.tsx
git commit -m "feat: redesign report page with two-column layout"
```

---

## Phase 7: JSON Parser Updates

### Task 7.1: Add WhyNow to JSON Parser

**Files:**
- Modify: `src/lib/json-parser.ts`

- [ ] **Step 1: Add whyNow parsing**
Ensure whyNow section is parsed and validated.

- [ ] **Step 2: Add summary field extraction**
Extract summary fields from all sections.

- [ ] **Step 3: Run TypeScript check**

- [ ] **Step 4: Commit**
```bash
git add src/lib/json-parser.ts
git commit -m "feat: add WhyNow and summary parsing to JSON parser"
```

---

## Phase 8: Orchestrator Updates

### Task 8.1: Update Orchestrator for WhyNow

**Files:**
- Modify: `src/lib/orchestrator.ts`

- [ ] **Step 1: Include WhyNow in mergePhaseResults**
Ensure WhyNow is included in final ValidationReport.

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/lib/orchestrator.ts
git commit -m "feat: include WhyNow section in orchestrator"
```

---

## Final Integration

### Task 9.1: Create Strength Utility

**Files:**
- Create: `src/lib/strength.ts`

- [ ] **Step 1: Export strength types and helpers**
```typescript
export type StrengthLevel = 'critical' | 'weak' | 'neutral' | 'good' | 'strong'

export function scoreToStrength(score: number): StrengthLevel {
  if (score >= 80) return 'strong'
  if (score >= 65) return 'good'
  if (score >= 50) return 'neutral'
  if (score >= 35) return 'weak'
  return 'critical'
}

export const strengthStyles: Record<StrengthLevel, string> = {
  critical: 'border-l-red-500 bg-red-50/30',
  weak: 'border-l-amber-500 bg-amber-50/30',
  neutral: 'border-l-slate-400 bg-white',
  good: 'border-l-emerald-500 bg-emerald-50/30',
  strong: 'border-l-emerald-600 bg-emerald-100/50'
}
```

- [ ] **Step 2: Run TypeScript check**

- [ ] **Step 3: Commit**
```bash
git add src/lib/strength.ts
git commit -m "feat: add strength utility module"
```

---

### Task 9.2: Create Report Components Index

**Files:**
- Create: `src/components/report/index.ts`

- [ ] **Step 1: Export all report components**
```typescript
export { HeroSection } from './hero-section'
export { ScoreOverview } from './score-overview'
export { ScoreCard } from './score-card'
export { SectionCard } from './section-card'
export * from './framework'
export * from './sidebar'
```

- [ ] **Step 2: Create framework index**
Create: `src/components/report/framework/index.ts`

- [ ] **Step 3: Create sidebar index**
Create: `src/components/report/sidebar/index.ts`

- [ ] **Step 4: Run TypeScript check**

- [ ] **Step 5: Commit**
```bash
git add src/components/report/
git commit -m "feat: add report components indexes"
```

---

## Testing & Verification

### Task 10.1: Run Full TypeScript Check

- [ ] **Step 1: Run TypeScript**
```bash
cd founder-signal && npx tsc --noEmit
```

- [ ] **Step 2: Fix any errors**

---

### Task 10.2: Test Report Page

- [ ] **Step 1: Start dev server**
```bash
npm run dev
```

- [ ] **Step 2: Navigate to result page**
Test with existing result ID or create new analysis.

- [ ] **Step 3: Verify layout**
- Two-column layout on desktop
- Single column on mobile
- Score gauge animation
- Score cards grid
- Sidebar components
- Section cards with detail links

- [ ] **Step 4: Test detail pages**
Navigate to each detail page via "See details" links.

---

## Final Commit

- [ ] **Step 1: Update AGENTS.md**
Document the redesign in the workspace tracking.

- [ ] **Step 2: Push to remote**
```bash
git push origin master
```

---

## Summary

**New Files Created:** ~25
**Files Modified:** ~5
**Estimated Time:** 15-20 minutes with parallel subagent execution

**Key Features:**
- Two-column responsive layout
- 10 section score cards in grid
- Circular score gauge with animation
- Market Matrix (2x2) visualization
- ACP Framework bars
- Why Now section (new)
- Dedicated detail pages for each section
- Enhanced market/competition data
- Summary fields for all sections

**Removed:**
- ReportTabs component
- SimplifiedReport view
- Single-column grid layout
