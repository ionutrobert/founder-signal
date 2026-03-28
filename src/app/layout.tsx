import './globals.css'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { cn } from '@/lib/utils'

const geistSans = Geist({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Founder Signal — Validate Your Startup Idea',
  description:
    'AI-powered startup idea validation in seconds. Get actionable insights on market fit, competition, and risks.',
  keywords: ['startup', 'validation', 'AI', 'business', 'entrepreneur', 'idea validation'],
  authors: [{ name: 'Founder Signal' }],
  openGraph: {
    title: 'Founder Signal — Validate Your Startup Idea',
    description:
      'AI-powered startup idea validation in seconds. Get actionable insights on market fit, competition, and risks.',
    url: 'https://foundersignal.ai',
    siteName: 'Founder Signal',
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Founder Signal — Validate Your Startup Idea',
    description: 'AI-powered startup idea validation in seconds.',
    creator: '@foundersignal'
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(geistSans.variable, geistMono.variable, 'font-sans')}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
