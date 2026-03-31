'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const HISTORY_KEY = 'founder-signal:history'
const MAX_HISTORY = 10

export interface HistoryItem {
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
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(HISTORY_KEY)
      }
    } catch {
      // Ignore localStorage errors
    }
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
                <p className="truncate text-sm font-medium text-slate-900 max-w-[200px]">
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
