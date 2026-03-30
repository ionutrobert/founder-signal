import type { CreditBalance, CreditTransaction, CreditTransactionReason } from '@/types/user'

interface CreditStoreInterface {
  getBalance(userId: string): Promise<number>
  hasCredits(userId: string, amount: number): Promise<boolean>
  deductCredits(userId: string, amount: number, reason: CreditTransactionReason, description?: string): Promise<boolean>
  addCredits(userId: string, amount: number, reason: CreditTransactionReason, description?: string): Promise<void>
  getTransactions(userId: string, limit?: number): Promise<CreditTransaction[]>
}

class InMemoryCreditStore implements CreditStoreInterface {
  private balances: Map<string, CreditBalance> = new Map()
  private transactions: Map<string, CreditTransaction[]> = new Map()

  async getBalance(userId: string): Promise<number> {
    const balance = this.balances.get(userId)
    return balance?.balance ?? 0
  }

  async hasCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId)
    return balance >= amount
  }

  async deductCredits(userId: string, amount: number, reason: CreditTransactionReason, description?: string): Promise<boolean> {
    const currentBalance = await this.getBalance(userId)
    if (currentBalance < amount) {
      return false
    }

    const transaction: CreditTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId,
      amount: -amount,
      type: 'debit',
      reason,
      description,
      timestamp: Date.now(),
    }

    this.balances.set(userId, {
      userId,
      balance: currentBalance - amount,
      lastUpdated: Date.now(),
    })

    const userTransactions = this.transactions.get(userId) ?? []
    this.transactions.set(userId, [transaction, ...userTransactions])

    return true
  }

  async addCredits(userId: string, amount: number, reason: CreditTransactionReason, description?: string): Promise<void> {
    const currentBalance = await this.getBalance(userId)

    const transaction: CreditTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId,
      amount,
      type: 'credit',
      reason,
      description,
      timestamp: Date.now(),
    }

    this.balances.set(userId, {
      userId,
      balance: currentBalance + amount,
      lastUpdated: Date.now(),
    })

    const userTransactions = this.transactions.get(userId) ?? []
    this.transactions.set(userId, [transaction, ...userTransactions])
  }

  async getTransactions(userId: string, limit = 50): Promise<CreditTransaction[]> {
    const transactions = this.transactions.get(userId) ?? []
    return transactions.slice(0, limit)
  }

  setBalance(userId: string, balance: number): void {
    this.balances.set(userId, {
      userId,
      balance,
      lastUpdated: Date.now(),
    })
  }
}

export const creditStore = new InMemoryCreditStore()
export type { CreditStoreInterface }
