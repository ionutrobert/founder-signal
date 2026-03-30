export interface User {
  id: string
  email: string
  createdAt: number
  updatedAt: number
}

export interface UserProfile {
  userId: string
  displayName?: string
  avatarUrl?: string
}

export interface CreditBalance {
  userId: string
  balance: number
  lastUpdated: number
}

export type CreditTransactionType = 'debit' | 'credit'

export type CreditTransactionReason = 'analysis' | 'purchase' | 'refund' | 'bonus' | 'trial'

export interface CreditTransaction {
  id: string
  userId: string
  amount: number
  type: CreditTransactionType
  reason: CreditTransactionReason
  description?: string
  timestamp: number
}

export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  creditsPerMonth: number
  priceCents: number
  stripePriceId?: string
  status: 'active' | 'canceled' | 'expired'
  currentPeriodStart: number
  currentPeriodEnd: number
}
