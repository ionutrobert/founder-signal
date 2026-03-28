'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

const features = [
  {
    title: 'Demand Signals',
    description: 'Surface market clarity, urgency, and likely customer pull for your idea.'
  },
  {
    title: 'Blind Spots',
    description: 'Highlight risks, assumptions, and missing validation angles.'
  },
  {
    title: 'Next Moves',
    description: 'Generate immediate validation steps and positioning ideas.'
  }
]

export default function HomePage() {
  const router = useRouter()
  const [idea, setIdea] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!idea.trim()) {
      setError('Please describe your startup idea.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      })

      const data = await response.json()

      if (data.success) {
        const encodedData = encodeURIComponent(JSON.stringify(data.data))
        router.push(`/result?data=${encodedData}`)
      } else {
        setError(data.error?.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Unable to connect. Please check your internet connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-20 -left-20 h-80 w-80 rounded-full bg-purple-400/15 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-72 w-72 rounded-full bg-pink-400/15 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <section className="mb-12 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-600">Founder Signal</p>
          <h1 className="mb-4 text-4xl font-semibold text-slate-900 md:text-5xl">Validate Your Startup Idea</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            AI-powered analysis in seconds. Get actionable insights to de-risk your next move.
          </p>
        </section>

        <section className="mx-auto mb-16 max-w-2xl">
          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-lifted)]">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="idea" className="mb-2 block text-sm font-medium text-slate-700">
                    Describe your startup idea
                  </label>
                  <Textarea
                    id="idea"
                    placeholder="A platform that helps freelancers find equity-based startup opportunities..."
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    className="min-h-32 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                    disabled={isSubmitting}
                  />
                </div>

                {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

                <div className="flex justify-center">
                  <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-48 bg-primary text-primary-foreground">
                    {isSubmitting ? 'Analyzing...' : 'Analyze Idea'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
              <CardContent className="p-6">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}
