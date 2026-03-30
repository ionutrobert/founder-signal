'use client'

import { cn } from '@/lib/utils'

interface Competitor {
  name: string
  type: 'direct' | 'indirect'
  marketSize: number
  competitionLevel: number
}

interface MarketMatrixProps {
  yourIdea: {
    marketSize: number
    competitionLevel: number
  }
  competitors?: Competitor[]
  className?: string
}

export function MarketMatrix({
  yourIdea,
  competitors = [],
  className,
}: MarketMatrixProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="relative aspect-square max-w-md">
        <svg
          viewBox="0 0 200 200"
          className="h-full w-full"
          aria-label="Market positioning matrix"
        >
          <defs>
            <pattern
              id="grid"
              width="50%"
              height="50%"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 100 0 L 100 200 M 0 100 L 200 100"
                fill="none"
                stroke="rgb(226 232 240)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect x="0" y="0" width="200" height="200" fill="url(#grid)" />

          <line
            x1="100"
            y1="0"
            x2="100"
            y2="200"
            stroke="rgb(203 213 225)"
            strokeWidth="2"
          />
          <line
            x1="0"
            y1="100"
            x2="200"
            y2="100"
            stroke="rgb(203 213 225)"
            strokeWidth="2"
          />

          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            fill="rgb(254 243 199)"
            fillOpacity="0.3"
            rx="4"
          />
          <rect
            x="104"
            y="4"
            width="92"
            height="92"
            fill="rgb(220 252 231)"
            fillOpacity="0.3"
            rx="4"
          />
          <rect
            x="4"
            y="104"
            width="92"
            height="92"
            fill="rgb(254 226 226)"
            fillOpacity="0.3"
            rx="4"
          />
          <rect
            x="104"
            y="104"
            width="92"
            height="92"
            fill="rgb(254 243 199)"
            fillOpacity="0.3"
            rx="4"
          />

          {competitors.map((comp) => {
            const x = (comp.marketSize / 100) * 200
            const y = 200 - (comp.competitionLevel / 100) * 200
            const color = comp.type === 'direct' ? '#f87171' : '#fbbf24'
            return (
              <g key={comp.name}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#64748b"
                >
                  {comp.name}
                </text>
              </g>
            )
          })}

          <circle
            cx={(yourIdea.marketSize / 100) * 200}
            cy={200 - (yourIdea.competitionLevel / 100) * 200}
            r="10"
            fill="#6366f1"
            stroke="white"
            strokeWidth="3"
          />
          <text
            x={(yourIdea.marketSize / 100) * 200}
            y={200 - (yourIdea.competitionLevel / 100) * 200 - 16}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#4f46e5"
          >
            Your Idea
          </text>
        </svg>

        <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 transform text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Competition Level
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Market Size
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-indigo-500" />
          <span className="text-slate-600">Your Idea</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <span className="text-slate-600">Direct Competitor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="text-slate-600">Indirect Competitor</span>
        </div>
      </div>
    </div>
  )
}
