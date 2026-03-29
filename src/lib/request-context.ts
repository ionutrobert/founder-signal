import { AsyncLocalStorage } from 'async_hooks'

export interface RequestContextData {
  requestId: string
  idea: string
  startTime: number
  phases: { current: string; completed: string[] }
  failures: Array<{ phase: string; section: string; error: string }>
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContextData>()

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function createRequestContext(idea: string): RequestContextData {
  return {
    requestId: generateRequestId(),
    idea,
    startTime: Date.now(),
    phases: { current: 'idle', completed: [] },
    failures: []
  }
}

export function runWithContext<T>(context: RequestContextData, fn: () => T): T {
  return asyncLocalStorage.run(context, fn)
}

export function getRequestContext(): RequestContextData | undefined {
  return asyncLocalStorage.getStore()
}
