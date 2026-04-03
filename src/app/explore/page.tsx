import Link from 'next/link'
import { ArrowLeft, Lightbulb } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const metadata = {
title: 'Browse Ideas - Founder Signal',
description: 'Explore validated startup ideas',
}

export const dynamic = 'force-dynamic'

interface PublicIdea {
id: string
title: string
oneLiner: string
category: string
score: number
verdict: 'pass' | 'fail' | 'needs-work'
createdAt: string
isFeatured: boolean
}

async function getAllIdeas(): Promise<PublicIdea[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/public-ideas?limit=50`, {
      cache: 'no-store'
    })
    const data = await res.json()
    return data.data || []
  } catch {
    return []
  }
}

function IdeaCard({ idea }: { idea: PublicIdea }) {
const scoreColor = idea.score >= 80 ? 'text-emerald-600' : idea.score >= 60 ? 'text-amber-600' : 'text-red-600'

return (
<Link
href={`/result?id=${idea.id}`}
className="block p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow"
>
<div className="flex items-start justify-between mb-3">
<h3 className="font-semibold text-slate-900">{idea.title}</h3>
<span className={`text-2xl font-bold ${scoreColor}`}>{idea.score}</span>
</div>
<p className="text-sm text-slate-600 mb-3">{idea.oneLiner}</p>
<div className="flex items-center gap-2">
<span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
{idea.category}
</span>
{idea.isFeatured && (
<span className="text-xs px-2 py-1 bg-[#E7EB5D]/20 text-slate-700 rounded">
Featured
</span>
)}
</div>
</Link>
)
}

export default async function ExplorePage() {
  const ideas = await getAllIdeas()
return (
<main className="min-h-screen bg-slate-50">
<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
<Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8">
<ArrowLeft className="w-4 h-4" />
Back to home
</Link>

<div className="mb-12">
<h1 className="text-3xl font-semibold text-slate-900 mb-3">Browse Validated Ideas</h1>
<p className="text-slate-600 max-w-2xl">
Explore startup ideas that have been analyzed through our validation process. 
Get insights into market potential, competition, and execution strategies.
</p>
</div>

<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
{ideas.length > 0 ? (
ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
) : (
<div className="col-span-full text-center py-12">
<Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
<p className="text-slate-500">No featured ideas yet. Be the first to validate your idea!</p>
</div>
)}
</div>

<div className="mt-12 p-8 bg-white border border-slate-200 rounded-xl text-center">
<Lightbulb className="w-12 h-12 text-[#E7EB5D] mx-auto mb-4" />
<h2 className="text-xl font-semibold text-slate-900 mb-2">Have Your Own Idea?</h2>
<p className="text-slate-600 mb-6">
Validate your startup concept and see how it compares.
</p>
<Link href="/">
<Button className="bg-[#E7EB5D] hover:bg-[#d9dd52] text-slate-900">
Analyze Your Idea
</Button>
</Link>
</div>
</div>
</main>
)
}
