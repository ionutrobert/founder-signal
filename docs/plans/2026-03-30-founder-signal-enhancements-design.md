# Founder Signal Enhancements Design

**Date:** 2026-03-30
**Status:** Approved

## Overview

This design covers four enhancement areas for Founder Signal:
1. Scoring Intelligence — AI-returned section scores
2. Product Features — Save/Share/Compare
3. Technical Polish — Mobile, accessibility, performance
4. Revenue Foundation — Pre-Stripe infrastructure

Revenue-readiness (Stripe, accounts) is explicitly deferred to a later phase.

---

## 1. Scoring Intelligence Enhancement

### Problem
Section scores are currently derived from verdict (pass/fail/needs-work) with artificial variance. Users see "85/100" but it's not meaningful — just `pass → 85 + random variance`.

### Solution
Update AI prompts to return explicit `score` (0-100) and `reasoning` fields for each section. The orchestrator combines these using weighted averaging.

### Data Flow
```
AI Response → Section data with { score, reasoning } → Weighted average → Overall score
```

### Changes Required

**Prompts (`src/lib/prompts.ts`):**
- Add `score` field (integer 0-100) to each section schema
- Add `scoreReasoning` field (1-2 sentences explaining the score)
- Add examples in prompt showing scoring calibration

**JSON Parser (`src/lib/json-parser.ts`):**
- Extract `score` and `scoreReasoning` from each section
- Validate score is in range 0-100
- Fallback to derived score if AI omits it

**Orchestrator (`src/lib/orchestrator.ts`):**
- Replace `calculateScoreFromVerdict()` with AI-returned scores
- Use weighted average: `sum(score * weight) / sum(weights)`
- Store `scoreReasoning` in phase results

**UI (`src/app/result/page.tsx`):**
- Display `scoreReasoning` in tooltip on hover over section cards
- Show section score badges on each card header

### Trade-offs
- Increased token usage per request (~200-300 tokens)
- AI may need calibration to produce consistent scores
- Need prompt engineering for 0-100 scale consistency

---

## 2. Product Features (Save/Share/Compare)

### 2.1 Save Reports

**Current State:**
- Results already get a `resultId` and stored in `.results/` for 1 hour
- SSE complete event includes `resultId`

**Enhancements:**
- Add `Copy Link` button on result page header
- Link format: `https://domain.com/result?id={resultId}`
- Add `Download as PDF` button using browser print-to-PDF

### 2.2 Share Reports

**Implementation:**
- `Copy Link` copies URL to clipboard with toast notification
- PDF download opens print dialog with optimized styles
- Add Open Graph meta tags for link previews

### 2.3 Comparison Mode

**New Page:** `/compare`
- Accept query params: `?ids=id1,id2,id3`
- Load up to 3 results via API
- Display side-by-side table comparing:
  - Overall scores
  - Section scores
  - Verdicts
  - Key strengths/weaknesses

**UI Components:**
- `ComparisonTable` — Score breakdown comparison
- `ComparisonSummary` — Highlights which idea wins where

### 2.4 Idea History

**Storage (MVP):**
- Use `localStorage` key: `founder-signal:history`
- Store array of `{ resultId, idea, score, verdict, timestamp }`
- Keep last 10 analyses

**Homepage Integration:**
- Show "Recent Analyses" section if history exists
- Each item links to `/result?id={resultId}`
- Clear history option

**Future Migration:**
- When accounts added, link history to user profile
- Migrate localStorage to database

---

## 3. Technical Polish

### 3.1 Mobile UX

**Touch Targets:**
- Ensure all buttons have minimum 44x44px touch target
- Add padding to compact buttons
- Verify result cards stack correctly on mobile

**Processing Page:**
- Timeline should be vertically scrollable on mobile
- Activity messages should truncate gracefully
- Score circle scales appropriately

### 3.2 Error Handling

**Error States:**
- Network error: Show retry button (exists, polish styling)
- API timeout: Clear message, retry option
- Invalid response: "Something went wrong" with report link
- Rate limited: Show countdown timer

**Report Issue:**
- Add "Report Issue" link in error state
- Opens mailto: or GitHub issues

### 3.3 Performance

**Loading States:**
- Add skeleton loaders for result page cards
- Show progress indicator during PDF generation
- Lazy load comparison page components

**Bundle Size:**
- Code-split result page by tab
- Lazy load PDF generation library

### 3.4 Accessibility

**ARIA:**
- Add `aria-label` to all buttons
- Add `aria-live` regions for score updates
- Add `role="status"` to processing timeline

**Keyboard Navigation:**
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals/tooltips

**Color Contrast:**
- Verify all text meets WCAG AA (4.5:1 ratio)
- Check strength indicator colors

---

## 4. Revenue Foundation (Pre-Stripe)

### Goal
Prepare infrastructure so Stripe/user accounts can be added later without major refactoring. No actual auth or payments yet.

### 4.1 Type Definitions

**New Types (`src/types/user.ts`):**
```typescript
interface User {
  id: string
  email: string
  createdAt: number
}

interface CreditBalance {
  userId: string
  balance: number
  lastUpdated: number
}

interface CreditTransaction {
  id: string
  userId: string
  amount: number
  type: 'debit' | 'credit'
  reason: 'analysis' | 'purchase' | 'refund' | 'bonus'
  timestamp: number
}
```

### 4.2 Storage Interface

**Credit Storage (`src/lib/credit-store.ts`):**
```typescript
interface CreditStore {
  getBalance(userId: string): Promise<number>
  deductCredits(userId: string, amount: number, reason: string): Promise<boolean>
  addCredits(userId: string, amount: number, reason: string): Promise<void>
  getTransactions(userId: string, limit?: number): Promise<CreditTransaction[]>
}
```

**Initial Implementation:**
- In-memory storage (Map-based) for MVP
- Replace with database when auth is added

### 4.3 API Updates

**Rate Limiter (`src/lib/rate-limit.ts`):**
- Add `userId` parameter support
- Per-user limits in addition to per-API-key

**Request Context (`src/lib/request-context.ts`):**
- Add optional `userId` field
- Populate from auth when available

### 4.4 Result Ownership

**Result Store (`src/lib/result-store.ts`):**
```typescript
interface StoredResult {
  id: string
  ownerId?: string  // NEW
  data: ValidationReport
  createdAt: number
}
```

**New Functions:**
- `getResultsByOwner(ownerId: string)` — For "My Reports"
- `setOwner(resultId: string, ownerId: string)` — Claim ownership

### 4.5 Migration Path

When ready for auth/payments:
1. Add Supabase or Auth0 for authentication
2. Migrate `.results/` to database
3. Implement `CreditStore` with database backend
4. Connect Stripe for credit purchases
5. Add webhook for credit consumption

---

## Implementation Order

1. **Scoring Intelligence** — Core product quality
2. **Product Features** — User retention
3. **Technical Polish** — Experience quality
4. **Revenue Foundation** — Future-proofing

---

## Files to Create/Modify

### New Files
- `src/types/user.ts` — User/credit types
- `src/lib/credit-store.ts` — Credit storage interface
- `src/app/compare/page.tsx` — Comparison page
- `src/components/comparison-table.tsx` — Comparison UI
- `src/components/share-buttons.tsx` — Share/download buttons

### Modified Files
- `src/lib/prompts.ts` — Add score fields
- `src/lib/json-parser.ts` — Extract scores
- `src/lib/orchestrator.ts` — Use AI scores
- `src/lib/rate-limit.ts` — Add userId support
- `src/lib/result-store.ts` — Add ownerId
- `src/lib/request-context.ts` — Add userId
- `src/app/result/page.tsx` — Share buttons, score tooltips
- `src/app/page.tsx` — Recent analyses section

---

## Success Criteria

1. AI returns meaningful section scores with reasoning
2. Users can share results via link or PDF
3. Users can compare 2-3 ideas side-by-side
4. Mobile experience is polished and accessible
5. Infrastructure is ready for auth/payments integration
