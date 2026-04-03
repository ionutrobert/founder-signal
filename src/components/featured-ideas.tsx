'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Lightbulb, ArrowRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

export function FeaturedIdeas() {
	const [ideas, setIdeas] = useState<PublicIdea[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchIdeas() {
			try {
				const res = await fetch('/api/public-ideas?featured=true&limit=3')
				const data = await res.json()
				if (data.success) {
					setIdeas(data.data)
				}
			} catch (error) {
				console.error('Failed to fetch featured ideas:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchIdeas()
	}, [])

	if (loading) {
		return (
			<div className="grid md:grid-cols-3 gap-4">
				{[1, 2, 3].map(i => (
					<Card key={i} className="animate-pulse">
						<CardContent className="p-6">
							<div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
							<div className="h-3 bg-slate-200 rounded w-full mb-2" />
							<div className="h-3 bg-slate-200 rounded w-1/2" />
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	if (ideas.length === 0) {
		return null
	}

	return (
		<div className="space-y-6">
			<div className="grid md:grid-cols-3 gap-4">
				{ideas.map(idea => (
					<Link
						key={idea.id}
						href={`/result?id=${idea.id}`}
						className="block"
					>
						<Card className="hover:shadow-md transition-shadow h-full">
							<CardContent className="p-6">
								<div className="flex items-start justify-between mb-3">
									<h3 className="font-semibold text-slate-900 line-clamp-2 flex-1">
										{idea.title}
									</h3>
									<span className={`text-xl font-bold ml-3 ${
										idea.score >= 80 ? 'text-emerald-600' :
										idea.score >= 60 ? 'text-amber-600' :
										'text-red-600'
									}`}>
										{idea.score}
									</span>
								</div>
								<p className="text-sm text-slate-600 line-clamp-2 mb-3">
									{idea.oneLiner}
								</p>
								<span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
									{idea.category}
								</span>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
			<div className="text-center">
				<Link href="/explore">
					<Button variant="outline" className="gap-2">
						<Lightbulb className="w-4 h-4" />
						View All Ideas
						<ArrowRight className="w-4 h-4" />
					</Button>
				</Link>
			</div>
		</div>
	)
}
