import type { APIResponse, StreamAnalyzeEvent } from '@/types/validation'

interface StreamAnalyzeOptions {
  idea: string
  signal?: AbortSignal
  onEvent: (event: StreamAnalyzeEvent) => void
}

function parseSseChunk(chunk: string): StreamAnalyzeEvent[] {
  return chunk
    .split('\n\n')
    .map((message) => {
      const dataLines = message
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())

      if (dataLines.length === 0) {
        return null
      }

      try {
        return JSON.parse(dataLines.join('\n')) as StreamAnalyzeEvent
      } catch {
        return null
      }
    })
    .filter((event): event is StreamAnalyzeEvent => event !== null)
}

export async function streamAnalyzeIdea({ idea, signal, onEvent }: StreamAnalyzeOptions) {
  const response = await fetch('/api/stream-analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ idea }),
    signal
  })

  if (!response.ok) {
    let message = 'Unable to start live analysis.'

    try {
      const payload = (await response.json()) as APIResponse<never>

      if (!payload.success) {
        message = payload.error.message
      }
    } catch {}

    throw new Error(message)
  }

  if (!response.body) {
    throw new Error('Streaming response body was empty.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      buffer += decoder.decode()

      if (buffer.trim()) {
        for (const event of parseSseChunk(buffer)) {
          onEvent(event)
        }
      }

      break
    }

    buffer += decoder.decode(value, { stream: true })

    const segments = buffer.split('\n\n')
    buffer = segments.pop() ?? ''

    for (const segment of segments) {
      for (const event of parseSseChunk(segment)) {
        onEvent(event)
      }
    }
  }
}
