'use client'

import type { SVGProps } from 'react'

type Logo = {
  name: string
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}

function LinearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 24L24 8"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="23.5" cy="8.5" r="2.5" fill="currentColor" />
    </svg>
  )
}

function VercelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path d="M16 7L26 24H6L16 7Z" fill="currentColor" />
    </svg>
  )
}

function NotionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <rect x="6" y="6" width="20" height="20" rx="3.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M11 22V10L21 21V10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FigmaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <rect x="9" y="6" width="8" height="8" rx="4" fill="currentColor" />
      <rect x="9" y="14" width="8" height="8" rx="4" fill="currentColor" opacity="0.9" />
      <rect x="9" y="22" width="8" height="8" rx="4" fill="currentColor" opacity="0.8" />
      <rect x="17" y="6" width="8" height="8" rx="4" fill="currentColor" opacity="0.75" />
      <circle cx="21" cy="18" r="4" fill="currentColor" opacity="0.65" />
    </svg>
  )
}

function StripeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 32" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10.5 11.1C10.5 8.6 12.6 6.8 16 6.8C18.2 6.8 20.3 7.3 22.3 8.3L21 12.2C19.4 11.4 17.9 11 16.4 11C15.1 11 14.5 11.5 14.5 12.2C14.5 14.6 23.2 13.1 23.2 19.9C23.2 22.8 20.8 25.2 16.4 25.2C13.8 25.2 11.1 24.5 9.3 23.3L10.7 19.2C12.6 20.4 14.7 21 16.5 21C17.9 21 18.8 20.5 18.8 19.6C18.8 17.1 10.5 18.9 10.5 11.1Z"
        fill="currentColor"
      />
      <path d="M26 8H39.5L38.3 11.9H24.8L26 8Z" fill="currentColor" opacity="0.9" />
      <path d="M24.8 13.2H38.3L37.1 17.1H23.6L24.8 13.2Z" fill="currentColor" opacity="0.75" />
      <path d="M23.4 18.4H36.9L35.7 22.3H22.2L23.4 18.4Z" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

function SlackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <rect x="7" y="13" width="6" height="13" rx="3" fill="currentColor" />
      <rect x="13" y="7" width="6" height="13" rx="3" fill="currentColor" opacity="0.9" />
      <rect x="19" y="13" width="6" height="13" rx="3" fill="currentColor" opacity="0.75" />
      <rect x="13" y="19" width="6" height="6" rx="3" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

function ZoomIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 32" fill="none" aria-hidden="true" {...props}>
      <rect x="4" y="8" width="18" height="16" rx="5" fill="currentColor" />
      <path d="M23.5 13.2L31 9.8V22.2L23.5 18.8V13.2Z" fill="currentColor" opacity="0.78" />
    </svg>
  )
}

function WebflowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 32" fill="none" aria-hidden="true" {...props}>
      <path d="M5 22.5L12.5 9H19L13 22.5H5Z" fill="currentColor" />
      <path d="M16.5 22.5L24.5 9H31L25.6 18.8L35 15.1L31.8 22.5H16.5Z" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

const logos: Logo[] = [
  { name: 'Linear', Icon: LinearIcon },
  { name: 'Vercel', Icon: VercelIcon },
  { name: 'Notion', Icon: NotionIcon },
  { name: 'Figma', Icon: FigmaIcon },
  { name: 'Stripe', Icon: StripeIcon },
  { name: 'Slack', Icon: SlackIcon },
  { name: 'Zoom', Icon: ZoomIcon },
  { name: 'Webflow', Icon: WebflowIcon }
]

export function LogoCarousel() {
  const repeatedLogos = [0, 1, 2].flatMap((copy) =>
    logos.map((logo) => ({ ...logo, key: `${logo.name}-${copy}` }))
  )

  return (
    <section aria-label="Brands founders already know" className="mx-auto mb-16 max-w-6xl">
      <div className="rounded-[calc(var(--radius)+0.5rem)] border border-slate-200/70 bg-white/60 px-4 py-4 shadow-[var(--shadow-soft)] backdrop-blur-sm md:px-6">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Signals from the modern startup stack
        </p>

        <div className="logo-carousel-mask overflow-hidden">
          <div className="animate-marquee flex min-w-max items-center gap-4 md:gap-6">
            {repeatedLogos.map(({ name, Icon, key }) => (
              <div
                key={key}
                className="flex shrink-0 items-center gap-3 rounded-full border border-slate-200/60 bg-white/70 px-4 py-3 text-slate-500 opacity-55 grayscale transition-all duration-300 hover:-translate-y-0.5 hover:opacity-85 hover:grayscale-0 hover:text-slate-700"
              >
                <Icon className="h-5 w-auto shrink-0" />
                <span className="text-sm font-semibold tracking-[-0.02em] md:text-base">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
