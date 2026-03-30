# Report Page Redesign - Design Document

## Overview
Transform Founder Signal's report page from a card-based grid into an ideabrowser.com-inspired immersive report experience with two-column layout, rich visualizations, and dedicated detail pages.

## Goals
- Create a comprehensive, scannable report that rivals professional market research
- Replace tabs with inline expandable sections and dedicated detail pages
- Add visual framework representations (gauges, matrices, charts)
- Make the report shareable and professional-looking
- Maintain accessibility and mobile responsiveness

## Inspiration Analysis (ideabrowser.com)
**Key patterns to adapt:**
- Two-column layout: Main content (65%) + Contextual sidebar (35%)
- Hero header with prominent score display and quick metrics
- Score cards grid showing dimension scores (Opportunity, Problem, Feasibility, etc.)
- Framework visualizations (2x2 matrices, bar charts, value ladders)
- "Why Now" section explaining timing and momentum
- Expandable sections with "See all →" links to dedicated detail pages
- Inline CTAs and action sidebar
- Clean typography hierarchy with clear visual separation

## Architecture Changes

### 1. New Data Types to Add

```typescript
// WhyNow section
interface WhyNow {
  timing: string // Why is now the right time?
  marketForces: string[] // What trends/drivers make this urgent?
  enablingTechnology: string // What tech enables this?
  culturalShift: string // What behavior changed?
  score?: number
  scoreReasoning?: string
}

// Enhanced sections with summary fields
interface MarketInsight {
  // ... existing fields
  marketGrowthRate?: string // "20.5% CAGR"
  marketMaturity?: 'emerging' | 'growing' | 'mature' | 'declining'
  keyMetrics?: {
    name: string
    value: string
    trend: 'up' | 'down' | 'stable'
  }[]
}

interface Competition {
  // ... existing fields
  marketShareEstimate?: string // "Fragmented market, top 3 have 40%"
  competitiveIntensity?: 'low' | 'medium' | 'high'
}

interface ValidationReport {
  // ... existing fields
  whyNow: WhyNow // NEW SECTION
}
```

### 2. New Page Structure

```
src/app/
├── result/
│   ├── page.tsx              # Main report page (redesigned)
│   ├── layout.tsx            # Report layout with sidebar
│   ├── loading.tsx           # Loading skeleton
│   └── [section]/            # Detail pages for each section
│       ├── why-now/
│       │   └── page.tsx
│       ├── opportunity/
│       │   └── page.tsx
│       ├── problem/
│       │   └── page.tsx
│       └── ...
├── layout.tsx                # Root layout
└── page.tsx                  # Homepage

src/components/
├── report/
│   ├── hero-section.tsx           # Title, score, badges
│   ├── score-overview.tsx         # Grid of section scores
│   ├── score-card.tsx             # Individual score card
│   ├── section-card.tsx           # Collapsible section summary
│   ├── framework/
│   │   ├── score-gauge.tsx        # Circular score display
│   │   ├── market-matrix.tsx      # 2x2 competitive matrix
│   │   ├── acp-framework.tsx      # Audience/Community/Product bars
│   │   └── value-ladder.tsx       # Value progression visualization
│   └── sidebar/
│       ├── action-panel.tsx       # Download, share, compare
│       ├── quick-stats.tsx        # TAM/SAM/Growth metrics
│       └── framework-summary.tsx  # Mini framework previews
```

### 3. Layout Structure

**Main Report Page (`/result?id=xxx`)**
```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION                                               │
│  ┌──────────────────────────┬──────────────────────────┐   │
│  │ Title, One-liner         │ Overall Score Gauge      │   │
│  │ Badges (Pass, Category)  │ 78/100 - Good            │   │
│  │ Share buttons            │ Verdict badge            │   │
│  └──────────────────────────┴──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  SCORE OVERVIEW (Grid of 10 score cards)                   │
│  ┌──────┬──────┬──────┬──────┬─────────┐                   │
│  │ Idea │Problem│Audience│Market│Competition│ ...           │
│  │ 85   │ 72   │ 68    │ 81   │ 75      │                  │
│  └──────┴──────┴──────┴──────┴─────────┘                   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  WHY NOW SECTION (Highlighted)                             │
│  Timing, market forces, enabling technology                │
│  [See full analysis →]                                       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  CONTENT GRID (Two columns on desktop)                       │
│  ┌─────────────────────────────┬──────────────────────────┐│
│  │  SECTION CARDS (Main)       │  SIDEBAR (35%)           ││
│  │  ┌────────────────────────┐ │  ┌──────────────────────┐││
│  │  │ Problem Summary        │ │  │ Actions              │││
│  │  │ [Expandable]           │ │  │ • Download PDF       │││
│  │  │ [See details →]        │ │  │ • Compare Ideas      │││
│  │  └────────────────────────┘ │  │ • Share              │││
│  │  ┌────────────────────────┐ │  └──────────────────────┘││
│  │  │ Market Overview        │ │  ┌──────────────────────┐││
│  │  │ With Market Matrix     │ │  │ Quick Stats          │││
│  │  │ visualization          │ │  │ TAM: $12B            │││
│  │  │ [See details →]        │ │  │ Growth: +24%         │││
│  │  └────────────────────────┘ │  └──────────────────────┘││
│  │  ┌────────────────────────┐ │  ┌──────────────────────┐││
│  │  │ Competition            │ │  │ Framework Fit       │││
│  │  │ Positioning map        │ │  │ ACP: 6/10            │││
│  │  │ [See details →]        │ │  └──────────────────────┘││
│  │  └────────────────────────┘ │                          ││
│  │  ... more sections          │                          ││
│  └─────────────────────────────┴──────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Detail Pages (`/result/[section]/page.tsx`)**
- Full-screen detailed view of each section
- All data points expanded
- Visualizations at full size
- Back navigation to main report
- URL structure: `/result/why-now?id=xxx`

### 4. Visual Design

**Colors**
- Keep existing slate/emerald/amber/red palette
- Score cards: White background with colored top borders (strength-based)
- Sidebar: Subtle slate-50 background
- Framework visualizations: Brand colors (blue/purple gradients)

**Typography**
- Hero title: text-4xl font-semibold
- Section titles: text-xl font-semibold
- Body: text-sm leading-relaxed
- Scores: text-2xl font-bold

**Spacing**
- Hero: py-12
- Score grid: gap-4
- Content grid: gap-8
- Section cards: p-6

### 5. Component Specifications

**ScoreCard**
```typescript
interface ScoreCardProps {
  title: string
  score: number
  strength: StrengthLevel
  href?: string // Link to detail page
  summary?: string // 1-line summary
}
```
- Visual: White card, colored top border based on score
- Shows score large, title small
- Optional "See more →" link

**SectionCard**
```typescript
interface SectionCardProps {
  title: string
  score: number
  strength: StrengthLevel
  children: ReactNode // Summary content
  detailHref: string
}
```
- Collapsible? Or always show summary?
- Shows first 2-3 key points
- "See full analysis →" button

**MarketMatrix (2x2)**
- X-axis: Market Size (Small → Large)
- Y-axis: Competition (Low → High)
- Plot: This idea, direct competitors, indirect alternatives
- Interactive: Hover for details

**ScoreGauge**
- Circular SVG gauge
- Color gradient based on score
- Animated on load

**ACPFramework**
- Three horizontal bars: Audience, Community, Product
- Score 0-10 for each
- Shows gap analysis

### 6. Mobile Responsiveness

**Desktop (lg+)**: Two-column layout
**Tablet (md)**: Single column, sidebar becomes horizontal
**Mobile (sm)**: Stacked layout, score grid becomes 2 columns

### 7. Data Flow

1. **Main Report Page**: Fetches full ValidationResult
2. **Detail Pages**: Fetch from same endpoint, filter to section
3. **Visualizations**: Computed from existing data (no new API calls)
4. **Why Now**: New section from updated prompts

### 8. Prompt Changes Required

Update validation prompts to include:
1. **WhyNow section** with timing, market forces, enabling tech, cultural shift
2. **Enhanced MarketInsight** with growth rate, maturity, key metrics
3. **Enhanced Competition** with market share estimate, intensity rating
4. **Summary fields** for each section (1-2 sentence summary for cards)

### 9. File Changes

**Modified:**
- `src/types/validation.ts` - Add WhyNow interface, enhance existing
- `src/lib/prompts.ts` - Add WhyNow to prompts, enhance section instructions
- `src/app/result/page.tsx` - Complete redesign
- `src/app/layout.tsx` - Maybe adjust for full-width reports

**New Components:**
- `src/components/report/hero-section.tsx`
- `src/components/report/score-overview.tsx`
- `src/components/report/score-card.tsx`
- `src/components/report/section-card.tsx`
- `src/components/report/framework/score-gauge.tsx`
- `src/components/report/framework/market-matrix.tsx`
- `src/components/report/framework/acp-framework.tsx`
- `src/components/report/sidebar/action-panel.tsx`
- `src/components/report/sidebar/quick-stats.tsx`

**New Pages:**
- `src/app/result/why-now/page.tsx`
- `src/app/result/opportunity/page.tsx`
- `src/app/result/problem/page.tsx`
- `src/app/result/audience/page.tsx`
- `src/app/result/market/page.tsx`
- `src/app/result/competition/page.tsx`
- `src/app/result/positioning/page.tsx`
- `src/app/result/mvp/page.tsx`
- `src/app/result/monetization/page.tsx`
- `src/app/result/risks/page.tsx`

### 10. Success Criteria

- [ ] Report page shows two-column layout on desktop
- [ ] Score overview grid displays all 10 section scores
- [ ] Each section has a summary card with "See details →" link
- [ ] Detail pages exist for all sections
- [ ] At least 3 framework visualizations implemented
- [ ] Why Now section included with new prompt data
- [ ] Mobile responsive layout works correctly
- [ ] TypeScript compilation passes
- [ ] All existing tests pass (or updated)

## Decision Log

- **Layout**: Two-column (65/35) rather than single column
- **Detail Pages**: Separate pages rather than modal/expand inline
- **Framework Visualizations**: Start with score gauge, market matrix, ACP
- **Why Now**: New section added to capture timing insights
- **Tabs**: Remove - report is now single scrollable page
- **Simplified Report**: Remove - comprehensive view is now the default

## Questions for Future

1. Should we add a "Compare" CTA that pre-fills the compare page?
2. Should section detail pages have unique OG meta tags for sharing?
3. Do we need PDF generation server-side, or is print-to-PDF sufficient?
4. Should we add "Related Ideas" or "Similar Analyses" recommendations?
