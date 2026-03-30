'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, BarChart3, Clock, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoCarousel } from '@/components/logo-carousel'

const features = [
  {
    icon: Zap,
    title: 'Instant Analysis',
    description: 'Get a comprehensive validation report in seconds, not weeks. Our AI evaluates your idea across 8 critical dimensions.',
  },
  {
    icon: Shield,
    title: 'Investor-Grade Insights',
    description: 'See what VCs look for: problem clarity, market timing, competition analysis, and realistic monetization strategies.',
  },
  {
    icon: BarChart3,
    title: 'Actionable Scoring',
    description: 'Each section receives a 0-100 score with specific reasoning. Know exactly where your idea shines and where it needs work.',
  },
  {
    icon: Clock,
    title: 'Save Months of Time',
    description: 'Validate before you build. Avoid costly pivots by understanding market demand and positioning upfront.',
  },
  {
    icon: Users,
    title: 'Target Audience Clarity',
    description: 'Define your ideal customer profile, understand their pain points, and validate your value proposition.',
  },
  {
    icon: Sparkles,
    title: 'Competitive Intelligence',
    description: 'Map your competitive landscape, identify your advantages, and craft messaging that resonates.',
  },
]

const stats = [
  { value: '8', label: 'Validation Dimensions', suffix: '' },
  { value: '1000', label: 'Founders Helped', suffix: '+' },
  { value: '90', label: 'Avg. Time Saved', suffix: '%' },
  { value: '4.9', label: 'User Rating', suffix: '/5' },
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-900 leading-[1.1] tracking-tight">
                Everything you need to{' '}
                <span className="font-serif italic">validate</span> your startup
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                From initial idea to market-ready positioning. Get the insights founders
                wish they had before building.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <Link href="/#validate">
                  <Button
                    size="lg"
                    className="bg-[#E7EB5D] hover:bg-[#d9dd55] text-slate-900 font-medium px-6 h-12 rounded-full"
                  >
                    Validate Your Idea
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logo Carousel */}
      <section className="py-8 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500 mb-6">
            Trusted by founders at
          </p>
          <LogoCarousel />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-slate-900">
                  {stat.value}
                  <span className="text-[#E7EB5D]">{stat.suffix}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-slate-900">
              How it works
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Three simple steps to get investor-grade validation for your startup idea.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Describe Your Idea',
                description: 'Share what you\'re building in your own words. No pitch deck required—just a clear description of the problem you\'re solving.',
              },
              {
                step: '02',
                title: 'AI Analysis',
                description: 'Our AI evaluates your idea across 8 dimensions including problem clarity, market timing, competition, and monetization potential.',
              },
              {
                step: '03',
                title: 'Get Your Report',
                description: 'Receive a comprehensive validation report with scores, reasoning, and actionable next steps. Share it with your team or investors.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-slate-100 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative pt-8">
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-slate-900">
              What you get
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Comprehensive analysis across every dimension investors care about.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#E7EB5D]/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-slate-900" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-3xl p-8 lg:p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4">
              Ready to validate your idea?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of founders who got clarity before building.
            </p>
            <Link href="/#validate">
              <Button
                size="lg"
                className="bg-[#E7EB5D] hover:bg-[#d9dd55] text-slate-900 font-medium px-8 h-12 rounded-full"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
