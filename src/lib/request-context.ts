import { AsyncLocalStorage } from 'async_hooks'

export interface RequestContextData {
  requestId: string
  idea: string
  startTime: number
  userId?: string
  phases: { current: string; completed: string[] }
  failures: Array<{ phase: string; section: string; error: string }>
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContextData>()

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function createRequestContext(idea: string, userId?: string): RequestContextData {
  return {
    requestId: generateRequestId(),
    idea,
    startTime: Date.now(),
    userId,
    phases: { current: 'idle', completed: [] },
    failures: []
  }
}

export function setRequestContext(ctx: Partial<RequestContextData> & { requestId: string }): void {
  asyncLocalStorage.run({
    requestId: ctx.requestId,
    idea: ctx.idea ?? '',
    startTime: ctx.startTime ?? Date.now(),
    userId: ctx.userId,
    phases: ctx.phases ?? { current: 'idle', completed: [] },
    failures: ctx.failures ?? []
  }, () => {})
}

export function runWithContext<T>(context: RequestContextData, fn: () => T): T {
  return asyncLocalStorage.run(context, fn)
}

export function getRequestContext(): RequestContextData | undefined {
  return asyncLocalStorage.getStore()
}

export function getUserId(): string | undefined {
  const ctx = getRequestContext()
  return ctx?.userId
}
