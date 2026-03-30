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

function DiscordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path d="M26.8 9.2C24.9 8.4 22.9 7.8 20.8 7.5C20.7 7.5 20.6 7.6 20.5 7.7C20.3 8.1 20.1 8.6 19.9 9C17.6 8.7 15.4 8.7 13.1 9C12.9 8.6 12.7 8.1 12.5 7.7C12.4 7.6 12.3 7.5 12.2 7.5C10.1 7.8 8.1 8.4 6.2 9.2C6.1 9.2 6 9.3 6 9.4C2.4 15.3 1.3 21 1.8 26.6C1.8 26.7 1.9 26.8 2 26.9C4.5 28.6 7 29.7 9.5 30.4C9.6 30.4 9.7 30.4 9.8 30.3C10.3 29.6 10.7 28.9 11.1 28.1C11.2 27.9 11.1 27.7 10.9 27.7C10.1 27.4 9.3 27.1 8.6 26.7C8.4 26.6 8.4 26.3 8.6 26.1C8.7 26 8.8 25.9 9 25.8C9.1 25.7 9.3 25.7 9.4 25.8C13.6 27.8 18.4 27.8 22.6 25.8C22.8 25.7 23 25.7 23.1 25.8C23.2 25.9 23.4 26 23.5 26.1C23.7 26.3 23.7 26.6 23.4 26.7C22.7 27.1 21.9 27.4 21.1 27.7C20.9 27.7 20.8 28 20.9 28.2C21.3 28.9 21.7 29.7 22.2 30.3C22.3 30.4 22.4 30.4 22.5 30.4C25 29.7 27.5 28.6 30 26.9C30.1 26.8 30.2 26.7 30.2 26.6C30.8 20.2 29.3 14.5 26 9.4C26 9.3 25.9 9.2 25.8 9.2H26.8V9.2ZM11.6 22.6C10 22.6 8.7 21.2 8.7 19.5C8.7 17.8 10 16.4 11.6 16.4C13.3 16.4 14.6 17.8 14.6 19.5C14.6 21.2 13.3 22.6 11.6 22.6ZM20.4 22.6C18.8 22.6 17.5 21.2 17.5 19.5C17.5 17.8 18.8 16.4 20.4 16.4C22.1 16.4 23.4 17.8 23.4 19.5C23.4 21.2 22.1 22.6 20.4 22.6Z" fill="currentColor" />
    </svg>
  )
}

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M16 2C8.27 2 2 8.27 2 16C2 21.99 5.87 27.11 11.37 28.88C11.87 28.97 12.06 28.67 12.06 28.41C12.06 28.18 12.06 27.55 12.05 26.69C8.42 27.48 7.54 24.83 7.54 24.83C6.88 23.28 5.94 22.84 5.94 22.84C4.73 22.05 5.94 22.06 5.94 22.06C7.18 22.14 7.86 23.33 7.86 23.33C8.92 25.21 10.72 24.66 11.37 24.36C11.47 23.56 11.79 23.01 12.14 22.68C9.23 22.35 6.13 21.24 6.13 16.45C6.13 15.02 6.57 13.86 7.41 12.96C7.29 12.63 6.84 11.36 7.53 9.64C7.53 9.64 8.56 9.36 11.04 10.97C12.15 10.67 13.41 10.52 14.67 10.52C15.93 10.52 17.19 10.67 18.3 10.97C20.78 9.36 21.81 9.64 21.81 9.64C22.5 11.36 22.05 12.63 21.93 12.96C22.77 13.86 23.21 15.02 23.21 16.45C23.21 21.25 20.1 22.34 17.19 22.67C17.63 23.08 18.02 23.88 18.02 25.11C18.02 26.88 18 28.32 18 28.75C18 29 18.19 29.3 18.69 29.21C24.19 27.44 28.06 22.32 28.06 16.34C28.06 8.27 21.73 2 16 2Z" fill="currentColor" />
    </svg>
  )
}

function FramerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path d="M4 0H28V10.67H17.33V16H28V26.67H17.33V32L4 21.33V16H4V0ZM12 10.67V5.33H17.33V10.67H12Z" fill="currentColor" />
    </svg>
  )
}

function RaycastIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path d="M16 2L30 16L16 30L2 16L16 2Z" fill="currentColor" />
      <path d="M16 8L24 16L16 24L8 16L16 8Z" fill="white" />
    </svg>
  )
}

function SupabaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path d="M16 2L24 20H8L16 2Z" fill="currentColor" />
      <path d="M16 30L8 12H24L16 30Z" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

function TailwindIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M16 8C12 8 9.5 10 8 14C9.5 12 11 11.5 12.5 12C13.5 12.5 14.2 13.5 15 15C16.5 18 18.5 20 23 20C27 20 29.5 18 31 14C29.5 16 28 16.5 26.5 16C25.5 15.5 24.8 14.5 24 13C22.5 10 20.5 8 16 8ZM8 20C4 20 1.5 22 0 26C1.5 24 3 23.5 4.5 24C5.5 24.5 6.2 25.5 7 27C8.5 30 10.5 32 15 32C19 32 21.5 30 23 26C21.5 28 20 28.5 18.5 28C17.5 27.5 16.8 26.5 16 25C14.5 22 12.5 20 8 20Z" fill="currentColor" />
    </svg>
  )
}

function ReplitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path d="M8 4H20V12H8V4Z" fill="currentColor" />
      <path d="M8 12H20V20H8V12Z" fill="currentColor" opacity="0.8" />
      <path d="M8 20H20V28H8V20Z" fill="currentColor" opacity="0.6" />
      <path d="M20 12H28V20H20V12Z" fill="currentColor" opacity="0.4" />
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
  { name: 'Webflow', Icon: WebflowIcon },
  { name: 'Discord', Icon: DiscordIcon },
  { name: 'GitHub', Icon: GitHubIcon },
  { name: 'Framer', Icon: FramerIcon },
  { name: 'Raycast', Icon: RaycastIcon },
  { name: 'Supabase', Icon: SupabaseIcon },
  { name: 'Tailwind', Icon: TailwindIcon },
  { name: 'Replit', Icon: ReplitIcon },
]

export function LogoCarousel() {
  // Create multiple copies for seamless infinite scroll
  const repeatedLogos = [0, 1, 2, 3].flatMap((copy) =>
    logos.map((logo) => ({ ...logo, key: `${logo.name}-${copy}` }))
  )

  return (
    <div className="relative overflow-hidden">
      {/* Left fade mask */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      {/* Right fade mask */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      
      <div className="flex animate-marquee items-center gap-8 whitespace-nowrap">
        {repeatedLogos.map(({ name, Icon, key }) => (
          <div
            key={key}
            className="flex shrink-0 items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors duration-300"
          >
            <Icon className="h-6 w-auto shrink-0" />
            <span className="text-sm font-medium tracking-tight">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
