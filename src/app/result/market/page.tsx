'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreGauge } from '@/components/report/framework/score-gauge'
import type { MarketInsight } from '@/types/validation'

function BulletList({ items, emptyLabel }: { items?: string[] | null; emptyLabel: string }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  const cleanItem = (item: string) => item.replace(/^[•\-\*\u2022\u2023]\s*/, '').trim()

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          <span>{cleanItem(item)}</span>
        </li>
      ))}
    </ul>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="text-sm leading-6 text-slate-700">{value}</p>
    </div>
  )
}

function Subsection({
  title,
  children,
  description
}: {
  title: string
  children: React.ReactNode
  description?: string
}) {
  return (
    <div className="space-y-3 rounded-[calc(var(--radius)-0.1rem)] border border-slate-200/80 bg-slate-50/70 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}

function MarketContent() {
  const searchParams = useSearchParams()
  const resultId = searchParams.get('id')
  const [section, setSection] = useState<MarketInsight | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!resultId) {
      setIsLoading(false)
      return
    }

    fetch(`/api/result/${resultId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.data?.marketInsight) {
          setSection(data.data.marketInsight)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [resultId])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-32 rounded bg-slate-200" />
            <div className="h-64 rounded-lg bg-slate-200" />
          </div>
        </div>
      </main>
    )
  }

  if (!section) {
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
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">Section not found.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const sectionScore = section.score ?? 0

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
                <Badge className="mb-2" variant="outline">Opportunity</Badge>
                <CardTitle className="text-2xl">Market Insight</CardTitle>
              </div>
              <ScoreGauge score={sectionScore} size="sm" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="TAM" value={section.tam} />
              <Field label="SAM" value={section.sam} />
              <Field label="SOM" value={section.som} />
            </div>

            <Subsection title="Trends">
              <BulletList items={section.trends} emptyLabel="No market trends listed." />
            </Subsection>

            <Subsection title="Growth Signals">
              <BulletList items={section.growthSignals} emptyLabel="No growth signals listed." />
            </Subsection>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function MarketPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <MarketContent />
    </Suspense>
  )
}
