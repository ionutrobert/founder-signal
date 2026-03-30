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
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 rounded bg-slate-200" />
              <div className="h-64 rounded bg-slate-100" />
            </div>
          </div>
        </main>
      }
    >
      <ComparePageContent />
    </Suspense>
  )
}
