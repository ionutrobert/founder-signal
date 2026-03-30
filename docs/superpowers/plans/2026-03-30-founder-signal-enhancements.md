# Founder Signal Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement scoring intelligence, product features (save/share/compare), technical polish, and revenue foundation for Founder Signal.

**Architecture:** Update prompts for AI-returned scores, add share/compare UI, polish mobile UX, and prepare types for future auth/payments.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, NVIDIA NIM API

---

## File Structure

### New Files
- `src/types/user.ts` — User, credit, and transaction types
- `src/lib/credit-store.ts` — Credit storage interface (in-memory MVP)
- `src/app/compare/page.tsx` — Comparison page
- `src/components/comparison-table.tsx` — Side-by-side comparison UI
- `src/components/share-buttons.tsx` — Share/download buttons
- `src/components/recent-analyses.tsx` — Recent analyses on homepage
- `src/components/score-tooltip.tsx` — Tooltip for score reasoning

### Modified Files
- `src/lib/prompts.ts` — Add score fields to schemas
- `src/lib/json-parser.ts` — Extract scores from sections
- `src/lib/orchestrator.ts` — Use AI-returned scores
- `src/lib/rate-limit.ts` — Add userId support
- `src/lib/result-store.ts` — Add ownerId field
- `src/lib/request-context.ts` — Add userId field
- `src/app/result/page.tsx` — Share buttons, score tooltips, history tracking
- `src/app/page.tsx` — Recent analyses section
- `src/types/validation.ts` — Add scoreReasoning to section types

---

## Phase 1: Scoring Intelligence

### Task 1.1: Add Score Fields to Validation Types

**Files:**
- Modify: `src/types/validation.ts`

- [ ] **Step 1: Add scoreReasoning to IdeaSummary interface**
```typescript
export interface IdeaSummary {
  title: string
  oneLiner: string
  category: string
  problemTheme: string
  tractionEvidence: string[]
  score?: number           // NEW
  scoreReasoning?: string  // NEW
}
```

- [ ] **Step 2: Add score fields to all section interfaces**
Update each interface (ProblemClarity, TargetAudience, MarketInsight, Competition, Positioning, MVPScope, Monetization, Risks) to include:
```typescript
score?: number
scoreReasoning?: string
```

- [ ] **Step 3: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors (interfaces allow optional fields)

- [ ] **Step 4: Commit**
```bash
git add src/types/validation.ts
git commit -m "feat: add score and scoreReasoning fields to validation types"
```

---

### Task 1.2: Update Prompts to Request Scores

**Files:**
- Modify: `src/lib/prompts.ts`

- [ ] **Step 1: Add score instructions to research prompt**
Find the schema definition in `generateResearchPrompt()` and add:
```typescript
const scoreInstructions = `
For each section, provide:
- "score": integer 0-100 based on quality assessment
- "scoreReasoning": 1-2 sentences explaining the score

Scoring guidelines:
- 80-100: Excellent - strong evidence, clear problem, well-defined audience
- 65-79: Good - solid foundation with minor gaps
- 50-64: Adequate - usable but needs refinement
- 35-49: Weak - significant issues or missing information
- 0-34: Critical - fundamental problems or insufficient data
`
```

- [ ] **Step 2: Add score fields to JSON schema examples**
In the schema section, add score fields to each section example:
```typescript
"ideaSummary": {
  "title": "...",
  "oneLiner": "...",
  "category": "...",
  "problemTheme": "...",
  "tractionEvidence": [],
  "score": 75,
  "scoreReasoning": "Clear value proposition but lacks market validation evidence."
}
```

- [ ] **Step 3: Update structural prompt similarly**
Repeat for `generateStructuralPrompt()` with same score instructions.

- [ ] **Step 4: Update strategic prompt similarly**
Repeat for `generateStrategicPrompt()` with same score instructions.

- [ ] **Step 5: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**
```bash
git add src/lib/prompts.ts
git commit -m "feat: add scoring instructions to validation prompts"
```

---

### Task 1.3: Update JSON Parser to Extract Scores

**Files:**
- Modify: `src/lib/json-parser.ts`

- [ ] **Step 1: Add score extraction in parseSection function**
Locate where sections are parsed and ensure score fields are preserved:
```typescript
function parseSection<T>(data: unknown, sectionName: string): T | null {
  if (!data || typeof data !== 'object') return null
  const section = (data as Record<string, unknown>)[sectionName]
  if (!section || typeof section !== 'object') return null
  
  // Preserve score fields if present
  const parsed = section as T
  return parsed
}
```

- [ ] **Step 2: Add score validation helper**
```typescript
function validateScore(score: unknown): number | undefined {
  if (typeof score !== 'number') return undefined
  return Math.max(0, Math.min(100, Math.round(score)))
}
```

- [ ] **Step 3: Apply validation in parseValidationReport**
```typescript
// After parsing each section, validate scores
if (report.ideaSummary?.score !== undefined) {
  report.ideaSummary.score = validateScore(report.ideaSummary.score)
}
// Repeat for all sections
```

- [ ] **Step 4: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**
```bash
git add src/lib/json-parser.ts
git commit -m "feat: extract and validate AI-returned section scores"
```

---

### Task 1.4: Update Orchestrator to Use AI Scores

**Files:**
- Modify: `src/lib/orchestrator.ts`

- [ ] **Step 1: Create extractSectionScores function**
```typescript
function extractSectionScores(data: ValidationSections): SectionScore[] {
  const scores: SectionScore[] = []
  
  for (const [section, weight] of Object.entries(SECTION_WEIGHTS)) {
    const sectionData = data[section as keyof ValidationSections]
    if (sectionData && typeof sectionData === 'object' && 'score' in sectionData) {
      const score = (sectionData as { score?: number }).score
      if (typeof score === 'number') {
        scores.push({ section, score, weight })
      }
    }
  }
  
  return scores
}
```

- [ ] **Step 2: Update mergePhaseResults to use AI scores**
Replace the derived score calculation:
```typescript
function mergePhaseResults(
  research: PhaseResult & { data: ResearchResult },
  structural: PhaseResult & { data: StructuralResult },
  strategic: PhaseResult & { data: StrategicResult }
): ValidationResult {
  // Extract scores from AI response
  const structuralScores = extractSectionScoresFromData(structural.data)
  const strategicScores = extractSectionScoresFromData(strategic.data)
  
  const allSectionScores: SectionScore[] = [
    ...structuralScores,
    ...strategicScores,
  ]
  
  // Calculate overall from AI scores, fallback to derived
  const overallScore = allSectionScores.length > 0
    ? calculateOverallScore(allSectionScores)
    : deriveScoreFromVerdict(strategic.data.verdict)
  
  // ... rest of merge logic
}
```

- [ ] **Step 3: Add fallback function for missing scores**
```typescript
function deriveScoreFromVerdict(verdict: 'pass' | 'fail' | 'needs-work'): number {
  switch (verdict) {
    case 'pass': return 85
    case 'needs-work': return 70
    case 'fail': return 40
  }
}
```

- [ ] **Step 4: Update SSE to include score reasoning**
In the progress callback, include score reasoning when available:
```typescript
if (event.phase === 'STRATEGIC' && event.finalScore !== undefined) {
  // Score is now AI-computed, no change needed
  await writeSseChunk(writer, {
    type: 'score',
    value: event.finalScore
  })
}
```

- [ ] **Step 5: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**
```bash
git add src/lib/orchestrator.ts
git commit -m "feat: use AI-returned section scores for overall calculation"
```

---

### Task 1.5: Add Score Tooltip Component

**Files:**
- Create: `src/components/score-tooltip.tsx`

- [ ] **Step 1: Create ScoreTooltip component**
```typescript
'use client'

import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { StrengthLevel } from '@/components/strength-indicator'

interface ScoreTooltipProps {
  score?: number
  reasoning?: string
  strength: StrengthLevel | null
}

const strengthLabels: Record<StrengthLevel, string> = {
  critical: 'Critical issues',
  weak: 'Needs improvement',
  neutral: 'Adequate',
  good: 'Strong',
  strong: 'Excellent',
}

export function ScoreTooltip({ score, reasoning, strength }: ScoreTooltipProps) {
  if (!score || !reasoning) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="ml-1.5 inline-flex items-center">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" side="top">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{score}/100</span>
              {strength && (
                <span className="text-xs text-slate-500">
                  {strengthLabels[strength]}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">{reasoning}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

- [ ] **Step 2: Check if Tooltip component exists**
Run: `ls src/components/ui/tooltip.tsx`
If missing, install shadcn tooltip:
```bash
npx shadcn@latest add tooltip
```

- [ ] **Step 3: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**
```bash
git add src/components/score-tooltip.tsx
git commit -m "feat: add score tooltip component for reasoning display"
```

---

### Task 1.6: Integrate Score Tooltips into Result Page

**Files:**
- Modify: `src/app/result/page.tsx`

- [ ] **Step 1: Import ScoreTooltip**
```typescript
import { ScoreTooltip } from '@/components/score-tooltip'
```

- [ ] **Step 2: Add tooltip to CardTitle in each section**
Example for Idea Summary:
```typescript
<CardTitle className="flex items-center text-lg text-slate-900">
  Idea Summary
  <ScoreTooltip
    score={report.ideaSummary.score}
    reasoning={report.ideaSummary.scoreReasoning}
    strength={getSectionStrength('ideaSummary', report.phases)}
  />
</CardTitle>
```

- [ ] **Step 3: Repeat for all section cards**
Add the ScoreTooltip to: Problem Clarity, Target Audience, Market Insight, Competition, Positioning, MVP Scope, Monetization, Risks

- [ ] **Step 4: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**
```bash
git add src/app/result/page.tsx
git commit -m "feat: display score reasoning in section card tooltips"
```

---

## Phase 2: Product Features (Save/Share/Compare)

### Task 2.1: Create Share Buttons Component

**Files:**
- Create: `src/components/share-buttons.tsx`

- [ ] **Step 1: Create ShareButtons component**
```typescript
'use client'

import { Copy, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

interface ShareButtonsProps {
  resultId: string
  title: string
}

export function ShareButtons({ resultId, title }: ShareButtonsProps) {
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/result?id=${resultId}`
    : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: 'Link copied',
        description: 'Share link copied to clipboard',
      })
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title} - Founder Signal Report</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; }
              h1 { color: #0f172a; }
              .section { margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
              .score { font-size: 48px; font-weight: bold; color: #3b82f6; }
            </style>
          </head>
          <body>
            <h1>Founder Signal Report</h1>
            <h2>${title}</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <hr />
            <p>View full report at: ${shareUrl}</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-1.5"
      >
        <Copy className="h-4 w-4" />
        Copy Link
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownloadPDF}
        className="gap-1.5"
      >
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Check if toast component exists**
Run: `ls src/components/ui/use-toast.tsx`
If missing, install shadcn toast:
```bash
npx shadcn@latest add toast
```

- [ ] **Step 3: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**
```bash
git add src/components/share-buttons.tsx
git commit -m "feat: add share buttons component with copy link and PDF download"
```

---

### Task 2.2: Add Share Buttons to Result Page

**Files:**
- Modify: `src/app/result/page.tsx`

- [ ] **Step 1: Import ShareButtons**
```typescript
import { ShareButtons } from '@/components/share-buttons'
```

- [ ] **Step 2: Add Toaster component for toast notifications**
Add at the top of the return statement:
```typescript
import { Toaster } from '@/components/ui/toaster'
```

And in the JSX:
```typescript
<main className="min-h-screen...">
  <Toaster />
  {/* rest of content */}
</main>
```

- [ ] **Step 3: Add ShareButtons to result page header**
In the CardContent after the badges:
```typescript
<div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
  <Badge className={verdict.className}>{verdict.label}</Badge>
  <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
    {report.ideaSummary.category}
  </Badge>
  <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
    {report.ideaSummary.problemTheme}
  </Badge>
</div>
{resultId && (
  <div className="mt-4">
    <ShareButtons resultId={resultId} title={report.ideaSummary.title} />
  </div>
)}
```

- [ ] **Step 4: Extract resultId from state**
The resultId should already be available from the report data or URL params. Ensure it's accessible.

- [ ] **Step 5: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**
```bash
git add src/app/result/page.tsx
git commit -m "feat: add share buttons to result page header"
```

---

### Task 2.3: Create Recent Analyses Component

**Files:**
- Create: `src/components/recent-analyses.tsx`

- [ ] **Step 1: Create RecentAnalyses component**
```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const HISTORY_KEY = 'founder-signal:history'
const MAX_HISTORY = 10

interface HistoryItem {
  resultId: string
  idea: string
  score: number
  verdict: 'pass' | 'fail' | 'needs-work'
  timestamp: number
}

const verdictColors = {
  pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'needs-work': 'bg-amber-50 text-amber-700 border-amber-200',
  fail: 'bg-red-50 text-red-700 border-red-200',
}

export function RecentAnalyses() {
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY)
    setHistory([])
  }

  if (history.length === 0) return null

  return (
    <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base text-slate-900">Recent Analyses</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="text-slate-500 hover:text-slate-700"
        >
          Clear
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.slice(0, 5).map((item) => (
          <Link
            key={item.resultId}
            href={`/result?id=${item.resultId}`}
            className="flex items-center justify-between rounded-lg border border-slate-200/80 p-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <span className="text-sm font-semibold text-blue-600">{item.score}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.idea.slice(0, 50)}{item.idea.length > 50 ? '...' : ''}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {new Date(item.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge className={verdictColors[item.verdict]}>
              {item.verdict === 'needs-work' ? 'Needs Work' : item.verdict.charAt(0).toUpperCase() + item.verdict.slice(1)}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

export function saveToHistory(item: HistoryItem): void {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    const history: HistoryItem[] = stored ? JSON.parse(stored) : []
    
    // Avoid duplicates
    const filtered = history.filter(h => h.resultId !== item.resultId)
    
    // Add new item at start
    const updated = [item, ...filtered].slice(0, MAX_HISTORY)
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    // Ignore localStorage errors
  }
}
```

- [ ] **Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**
```bash
git add src/components/recent-analyses.tsx
git commit -m "feat: add recent analyses component with localStorage persistence"
```

---

### Task 2.4: Add Recent Analyses to Homepage

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Import RecentAnalyses**
```typescript
import { RecentAnalyses } from '@/components/recent-analyses'
```

- [ ] **Step 2: Add RecentAnalyses to homepage layout**
Add after the features section, before the footer:
```typescript
<section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
  <RecentAnalyses />
</section>
```

- [ ] **Step 3: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**
```bash
git add src/app/page.tsx
git commit -m "feat: add recent analyses section to homepage"
```

---

### Task 2.5: Save Analysis to History on Complete

**Files:**
- Modify: `src/app/result/page.tsx`

- [ ] **Step 1: Import saveToHistory**
```typescript
import { saveToHistory } from '@/components/recent-analyses'
```

- [ ] **Step 2: Save to history when report loads**
In the useEffect that loads the report:
```typescript
useEffect(() => {
  // ... existing result loading logic
  
  if (report && resultId) {
    saveToHistory({
      resultId,
      idea: report.ideaSummary.title,
      score: report.score,
      verdict: report.verdict,
      timestamp: Date.now(),
    })
  }
}, [report, resultId])
```

- [ ] **Step 3: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**
```bash
git add src/app/result/page.tsx
git commit -m "feat: save completed analyses to history"
```

---

### Task 2.6: Create Comparison Table Component

**Files:**
- Create: `src/components/comparison-table.tsx`

- [ ] **Step 1: Create ComparisonTable component**
```typescript
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

const sectionLabels: Record<string, string> = {
  ideaSummary: 'Idea Summary',
  problemClarity: 'Problem Clarity',
  targetAudience: 'Target Audience',
  marketInsight: 'Market Insight',
  competition: 'Competition',
  positioning: 'Positioning',
  mvpScope: 'MVP Scope',
  monetization: 'Monetization',
  risks: 'Risks',
}

export function ComparisonTable({ results }: ComparisonTableProps) {
  if (results.length === 0) {
    return <p className="text-slate-500">No results to compare.</p>
  }

  const sections = ['ideaSummary', 'problemClarity', 'targetAudience', 'marketInsight', 'competition', 'positioning', 'mvpScope', 'monetization', 'risks']

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
                {results.map((result, index) => (
                  <th key={result.ideaSummary.title + index} className="px-4 py-3 text-center font-medium text-slate-900">
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
              {sections.map((section) => (
                <tr key={section} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-600">
                    {sectionLabels[section]}
                  </td>
                  {results.map((result, index) => {
                    const sectionData = result[section as keyof ValidationResult] as { score?: number } | undefined
                    const score = sectionData?.score
                    
                    return (
                      <td key={section + index} className="px-4 py-3 text-center">
                        {score !== undefined ? (
                          <span className={`font-semibold ${
                            score >= 80 ? 'text-emerald-600' :
                            score >= 65 ? 'text-emerald-500' :
                            score >= 50 ? 'text-slate-600' :
                            score >= 35 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
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
```

- [ ] **Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**
```bash
git add src/components/comparison-table.tsx
git commit -m "feat: add comparison table component for side-by-side analysis"
```

---

### Task 2.7: Create Comparison Page

**Files:**
- Create: `src/app/compare/page.tsx`

- [ ] **Step 1: Create compare page**
```typescript
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComparisonTable } from '@/components/comparison-table'
import type { ValidationResult } from '@/types/validation'

function ComparePageContent() {
  const searchParams = useSearchParams()
  const [results, setResults] = useState<ValidationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ids = searchParams.get('ids')
    if (!ids) {
      setError('No result IDs provided. Add ?ids=id1,id2,id3 to the URL.')
      setLoading(false)
      return
    }

    const idList = ids.split(',').filter(Boolean).slice(0, 3)
    if (idList.length < 2) {
      setError('At least 2 result IDs are required for comparison.')
      setLoading(false)
      return
    }

    Promise.all(
      idList.map(id =>
        fetch(`/api/result/${id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) {
              return data.data as ValidationResult
            }
            return null
          })
      )
    )
      .then(fetched => {
        const valid = fetched.filter(Boolean) as ValidationResult[]
        if (valid.length < 2) {
          setError('Could not load enough valid results for comparison.')
        } else {
          setResults(valid)
        }
      })
      .catch(() => {
        setError('Failed to load results.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchParams])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-slate-200" />
            <div className="h-64 rounded bg-slate-100" />
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <Link href="/">
              <Button type="button" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button type="button" variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            Compare Ideas
          </h1>
          <p className="text-slate-600">
            Side-by-side comparison of {results.length} analyses
          </p>
        </div>

        <ComparisonTable results={results} />
      </div>
    </main>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-slate-200" />
            <div className="h-64 rounded bg-slate-100" />
          </div>
        </div>
      </main>
    }>
      <ComparePageContent />
    </Suspense>
  )
}
```

- [ ] **Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**
```bash
git add src/app/compare/page.tsx
git commit -m "feat: add comparison page for side-by-side analysis"
```

---

## Phase 3: Technical Polish

### Task 3.1: Add Mobile Touch Target Fixes

**Files:**
- Modify: `src/app/result/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/processing/page.tsx`

- [ ] **Step 1: Audit button touch targets on homepage**
Find all buttons and ensure minimum 44px height. Add `min-h-11` class where needed:
```typescript
<Button className="min-h-11 px-6">Analyze Idea</Button>
```

- [ ] **Step 2: Audit button touch targets on result page**
Same audit for share buttons, tab buttons, etc.

- [ ] **Step 3: Audit button touch targets on processing page**
Ensure retry button and navigation have proper touch targets.

- [ ] **Step 4: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**
```bash
git add src/app/result/page.tsx src/app/page.tsx src/app/processing/page.tsx
git commit -m "fix: ensure minimum touch targets for mobile accessibility"
```

---

### Task 3.2: Add Loading Skeletons to Result Page

**Files:**
- Modify: `src/app/result/page.tsx`

- [ ] **Step 1: Enhance LoadingSkeleton component**
The existing LoadingSkeleton can be improved with more realistic structure. Verify it matches the actual result page layout.

- [ ] **Step 2: Add skeleton for tab content**
Add skeleton variants for technical and simplified tabs:
```typescript
function TabSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**
```bash
git add src/app/result/page.tsx
git commit -m "feat: enhance loading skeletons for result page"
```

---

### Task 3.3: Add ARIA Labels to Interactive Elements

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/result/page.tsx`
- Modify: `src/components/share-buttons.tsx`

- [ ] **Step 1: Add aria-label to homepage form**
```typescript
<Textarea
  aria-label="Startup idea description"
  placeholder="Describe your startup idea..."
/>
<Button aria-label="Analyze startup idea">
  Analyze
</Button>
```

- [ ] **Step 2: Add aria-label to share buttons**
```typescript
<Button aria-label="Copy share link to clipboard" ...>
<Button aria-label="Download report as PDF" ...>
```

- [ ] **Step 3: Add aria-live to score updates on processing page**
```typescript
<div aria-live="polite" aria-atomic="true">
  <StreamingScore value={score} status={isStreaming ? 'Streaming' : 'Ready'} />
</div>
```

- [ ] **Step 4: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**
```bash
git add src/app/page.tsx src/app/result/page.tsx src/components/share-buttons.tsx src/app/processing/page.tsx
git commit -m "a11y: add ARIA labels for screen reader accessibility"
```

---

### Task 3.4: Add Open Graph Meta Tags

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add Open Graph metadata to layout**
```typescript
export const metadata: Metadata = {
  title: 'Founder Signal - Validate Your Startup Idea',
  description: 'AI-powered startup idea validation. Get a structured report with scores, verdicts, and actionable insights.',
  openGraph: {
    title: 'Founder Signal - Validate Your Startup Idea',
    description: 'AI-powered startup idea validation with actionable insights.',
    type: 'website',
    url: 'https://foundersignal.com',
    siteName: 'Founder Signal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Founder Signal - Validate Your Startup Idea',
    description: 'AI-powered startup idea validation with actionable insights.',
  },
}
```

- [ ] **Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**
```bash
git add src/app/layout.tsx
git commit -m "feat: add Open Graph and Twitter card meta tags"
```

---

## Phase 4: Revenue Foundation

### Task 4.1: Create User and Credit Types

**Files:**
- Create: `src/types/user.ts`

- [ ] **Step 1: Create user types file**
```typescript
export interface User {
  id: string
  email: string
  createdAt: number
  updatedAt: number
}

export interface UserProfile {
  userId: string
  displayName?: string
  avatarUrl?: string
}

export interface CreditBalance {
  userId: string
  balance: number
  lastUpdated: number
}

export type CreditTransactionType = 'debit' | 'credit'
export type CreditTransactionReason = 'analysis' | 'purchase' | 'refund' | 'bonus' | 'trial'

export interface CreditTransaction {
  id: string
  userId: string
  amount: number
  type: CreditTransactionType
  reason: CreditTransactionReason
  description?: string
  timestamp: number
}

export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  creditsPerMonth: number
  priceCents: number
  stripePriceId?: string
  status: 'active' | 'canceled' | 'expired'
  currentPeriodStart: number
  currentPeriodEnd: number
}
```

- [ ] **Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**
```bash
git add src/types/user.ts
git commit -m "feat: add user, credit, and subscription type definitions"
```

---

### Task 4.2: Create Credit Store Interface

**Files:**
- Create: `src/lib/credit-store.ts`

- [ ] **Step 1: Create credit store with in-memory implementation**
```typescript
import type { CreditBalance, CreditTransaction, CreditTransactionReason } from '@/types/user'

interface CreditStoreInterface {
  getBalance(userId: string): Promise<number>
  hasCredits(userId: string, amount: number): Promise<boolean>
  deductCredits(userId: string, amount: number, reason: CreditTransactionReason, description?: string): Promise<boolean>
  addCredits(userId: string, amount: number, reason: CreditTransactionReason, description?: string): Promise<void>
  getTransactions(userId: string, limit?: number): Promise<CreditTransaction[]>
}

class InMemoryCreditStore implements CreditStoreInterface {
  private balances: Map<string, CreditBalance> = new Map()
  private transactions: Map<string, CreditTransaction[]> = new Map()

  async getBalance(userId: string): Promise<number> {
    const balance = this.balances.get(userId)
    return balance?.balance ?? 0
  }

  async hasCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId)
    return balance >= amount
  }

  async deductCredits(userId: string, amount: number, reason: CreditTransactionReason, description?: string): Promise<boolean> {
    const currentBalance = await this.getBalance(userId)
    if (currentBalance < amount) {
      return false
    }

    const transaction: CreditTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId,
      amount: -amount,
      type: 'debit',
      reason,
      description,
      timestamp: Date.now(),
    }

    this.balances.set(userId, {
      userId,
      balance: currentBalance - amount,
      lastUpdated: Date.now(),
    })

    const userTransactions = this.transactions.get(userId) ?? []
    this.transactions.set(userId, [transaction, ...userTransactions])

    return true
  }

  async addCredits(userId: string, amount: number, reason: CreditTransactionReason, description?: string): Promise<void> {
    const currentBalance = await this.getBalance(userId)

    const transaction: CreditTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId,
      amount,
      type: 'credit',
      reason,
      description,
      timestamp: Date.now(),
    }

    this.balances.set(userId, {
      userId,
      balance: currentBalance + amount,
      lastUpdated: Date.now(),
    })

    const userTransactions = this.transactions.get(userId) ?? []
    this.transactions.set(userId, [transaction, ...userTransactions])
  }

  async getTransactions(userId: string, limit = 50): Promise<CreditTransaction[]> {
    const transactions = this.transactions.get(userId) ?? []
    return transactions.slice(0, limit)
  }

  // For testing/setup
  setBalance(userId: string, balance: number): void {
    this.balances.set(userId, {
      userId,
      balance,
      lastUpdated: Date.now(),
    })
  }
}

export const creditStore = new InMemoryCreditStore()
export type { CreditStoreInterface }
```

- [ ] **Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**
```bash
git add src/lib/credit-store.ts
git commit -m "feat: add in-memory credit store for future billing integration"
```

---

### Task 4.3: Add Owner Field to Result Store

**Files:**
- Modify: `src/lib/result-store.ts`

- [ ] **Step 1: Add ownerId to StoredResult interface**
```typescript
interface StoredResult {
  id: string
  ownerId?: string  // NEW
  data: ValidationReport
  createdAt: number
  partialFailures?: ValidationResult['partialFailures']
  phaseErrors?: ValidationResult['phases']
}
```

- [ ] **Step 2: Add setOwner function**
```typescript
export async function setOwner(resultId: string, ownerId: string): Promise<boolean> {
  const filePath = await getFilePath(resultId)

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const stored: StoredResult = JSON.parse(content)
    stored.ownerId = ownerId
    await fs.writeFile(filePath, JSON.stringify(stored), 'utf-8')
    return true
  } catch {
    return false
  }
}
```

- [ ] **Step 3: Add getResultsByOwner function**
```typescript
export async function getResultsByOwner(ownerId: string): Promise<StoredResult[]> {
  await ensureResultsDir()

  try {
    const files = await fs.readdir(RESULTS_DIR)
    const results: StoredResult[] = []

    for (const file of files) {
      if (!file.endsWith('.json')) continue

      try {
        const filePath = path.join(RESULTS_DIR, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const stored: StoredResult = JSON.parse(content)

        if (stored.ownerId === ownerId && Date.now() - stored.createdAt <= MAX_AGE_MS) {
          results.push(stored)
        }
      } catch {
        // Ignore individual file errors
      }
    }

    return results.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Update storeResult to accept ownerId**
```typescript
export async function storeResult(
  data: ValidationReport,
  extra?: {
    partialFailures?: ValidationResult['partialFailures']
    phases?: ValidationResult['phases']
    ownerId?: string  // NEW
  }
): Promise<string> {
  await ensureResultsDir()

  const id = generateResultId()
  const filePath = await getFilePath(id)

  const stored: StoredResult = {
    id,
    data,
    createdAt: Date.now(),
    ...(extra?.ownerId && { ownerId: extra.ownerId }),
    ...(extra?.partialFailures && { partialFailures: extra.partialFailures }),
    ...(extra?.phases && { phaseErrors: extra.phases }),
  }

  await fs.writeFile(filePath, JSON.stringify(stored), 'utf-8')
  console.log(`[result-store] Stored: ${id}`)

  await cleanupOldResults()

  return id
}
```

- [ ] **Step 5: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**
```bash
git add src/lib/result-store.ts
git commit -m "feat: add ownerId field and getResultsByOwner function"
```

---

### Task 4.4: Add userId Support to Rate Limiter

**Files:**
- Modify: `src/lib/rate-limit.ts`

- [ ] **Step 1: Add userId-aware key generator**
```typescript
function getKeyWithUserId(request: NextRequest, userId?: string): string {
  if (userId) {
    return `ratelimit:user:${userId}`
  }
  return getDefaultKeyGenerator(request)
}
```

- [ ] **Step 2: Update rateLimit factory to accept userId**
```typescript
export function rateLimit(config: RateLimitConfig & { getUserId?: (request: NextRequest) => string | undefined }) {
  const {
    windowMs = 60000,
    maxRequests = 10,
    keyGenerator,
    getUserId,
  } = config

  return async function rateLimitMiddleware(
    request: NextRequest,
    userId?: string
  ): Promise<{ success: true } | { success: false; response: NextResponse }> {
    cleanupExpiredEntries()

    const key = userId ? getKeyWithUserId(request, userId) : (keyGenerator ?? getDefaultKeyGenerator)(request)
    // ... rest of existing logic
  }
}
```

- [ ] **Step 3: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**
```bash
git add src/lib/rate-limit.ts
git commit -m "feat: add userId support to rate limiter for per-user limits"
```

---

### Task 4.5: Add userId to Request Context

**Files:**
- Modify: `src/lib/request-context.ts`

- [ ] **Step 1: Add userId to RequestContext interface**
```typescript
interface RequestContext {
  requestId: string
  startTime: number
  userId?: string  // NEW
}
```

- [ ] **Step 2: Update setRequestContext to accept userId**
```typescript
export function setRequestContext(ctx: Partial<RequestContext> & { requestId: string }): void {
  asyncLocalStorage.run({
    requestId: ctx.requestId,
    startTime: ctx.startTime ?? Date.now(),
    userId: ctx.userId,
  })
}
```

- [ ] **Step 3: Add helper to get userId**
```typescript
export function getUserId(): string | undefined {
  const ctx = getRequestContext()
  return ctx?.userId
}
```

- [ ] **Step 4: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**
```bash
git add src/lib/request-context.ts
git commit -m "feat: add userId tracking in request context"
```

---

## Final Commit and Push

- [ ] **Step 1: Run full TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Push all commits**
```bash
git push origin master
```

- [ ] **Step 3: Update AGENTS.md with completion**
Document the completed tasks in the AGENTS.md file.

---

## Testing Checklist

After implementation, verify:

1. [ ] AI returns meaningful section scores (not all 85)
2. [ ] Score reasoning displays in tooltips
3. [ ] Copy link copies correct URL
4. [ ] PDF download opens print dialog
5. [ ] Recent analyses shows on homepage after analysis
6. [ ] Comparison page loads with `?ids=id1,id2`
7. [ ] Touch targets are 44px minimum on mobile
8. [ ] Screen reader can navigate all interactive elements
9. [ ] Credit store functions work (in-memory)
10. [ ] Result store tracks ownership
