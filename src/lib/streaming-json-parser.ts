/**
 * Streaming JSON Parser with Checkpoint Detection
 *
 * Parses partial JSON as tokens arrive and emits events when
 * top-level keys (sections) complete. This enables real progress
 * indication based on actual LLM output, not fake placeholders.
 */

export interface SectionCheckpoint {
  key: string
  data: unknown
  index: number
}

export interface StreamingParserCallbacks {
  onSectionComplete: (checkpoint: SectionCheckpoint) => void
  onToken?: (token: string) => void
}

interface ParseState {
  inString: boolean
  inKey: boolean
  escapeNext: boolean
  depth: number
  objectStartDepth: number
  currentKey: string
  keyStart: number
  valueStart: number
  sections: Map<string, { start: number; end?: number; data?: unknown }>
  completedSections: string[]
}

export class StreamingJsonParser {
  private buffer = ''
  private state: ParseState = this.createInitialState()
  private callbacks: StreamingParserCallbacks
  private knownSectionKeys: string[]
  private sectionIndex = 0

  constructor(sectionKeys: string[], callbacks: StreamingParserCallbacks) {
    this.knownSectionKeys = sectionKeys
    this.callbacks = callbacks
  }

  private createInitialState(): ParseState {
    return {
      inString: false,
      inKey: false,
      escapeNext: false,
      depth: 0,
      objectStartDepth: 0,
      currentKey: '',
      keyStart: -1,
      valueStart: -1,
      sections: new Map(),
      completedSections: [],
    }
  }

  /**
   * Push tokens into the parser
   * Returns completed sections found in this chunk
   */
  push(tokens: string): SectionCheckpoint[] {
    this.buffer += tokens
    const checkpoints: SectionCheckpoint[] = []

    for (let i = this.buffer.length - tokens.length; i < this.buffer.length; i++) {
      const char = this.buffer[i]
      if (char !== undefined) {
        this.processChar(char, i)
      }
    }

    // Check for newly completed sections
    for (const key of this.state.sections.keys()) {
      if (
        this.state.sections.get(key)?.end &&
        !this.state.completedSections.includes(key)
      ) {
        this.state.completedSections.push(key)
        const section = this.state.sections.get(key)!
        const checkpoint: SectionCheckpoint = {
          key,
          data: section.data,
          index: this.sectionIndex++,
        }
        checkpoints.push(checkpoint)
        this.callbacks.onSectionComplete(checkpoint)
      }
    }

    this.callbacks.onToken?.(tokens)
    return checkpoints
  }

  private processChar(char: string, index: number): void {
    if (this.state.escapeNext) {
      this.state.escapeNext = false
      return
    }

    if (char === '\\' && this.state.inString) {
      this.state.escapeNext = true
      return
    }

    // Track string boundaries
    if (char === '"' && !this.state.inString) {
      this.state.inString = true
      if (this.state.depth === 1 && this.state.currentKey === '') {
        this.state.keyStart = index
      }
      return
    }

    if (char === '"' && this.state.inString) {
      this.state.inString = false
      if (this.state.depth === 1 && this.state.keyStart >= 0) {
        this.state.currentKey = this.buffer.slice(this.state.keyStart + 1, index)
        this.state.keyStart = -1
      }
      return
    }

    if (this.state.inString) {
      return
    }

    // Track object depth
    if (char === '{') {
      this.state.depth++
      if (this.state.depth === 2 && this.knownSectionKeys.includes(this.state.currentKey)) {
        this.state.sections.set(this.state.currentKey, { start: index })
        this.state.valueStart = index
      }
      return
    }

    if (char === '}') {
      if (this.state.depth === 2 && this.state.currentKey) {
        const section = this.state.sections.get(this.state.currentKey)
        if (section && !section.end) {
          const jsonStr = this.buffer.slice(section.start, index + 1)
          try {
            section.data = JSON.parse(jsonStr)
            section.end = index
          } catch {
            // Incomplete JSON, continue parsing
          }
        }
      }
      this.state.depth--
      if (this.state.depth === 1) {
        this.state.currentKey = ''
      }
      return
    }

    // Key-value separator
    if (char === ':' && this.state.depth === 1) {
      this.state.valueStart = index + 1
      return
    }

    // Item separator - mark section as complete if we have data
    if (char === ',' && this.state.depth === 1) {
      if (this.state.currentKey) {
        const section = this.state.sections.get(this.state.currentKey)
        if (section && !section.end) {
          const jsonStr = this.buffer.slice(section.start, this.state.valueStart - 1).trim()
          const endMatch = jsonStr.match(/\}(\s*)$/)
          if (endMatch) {
            try {
              section.data = JSON.parse(jsonStr.slice(0, jsonStr.length))
              section.end = index - 1
            } catch {
              // Incomplete
            }
          }
        }
      }
      this.state.currentKey = ''
      return
    }
  }

  /**
   * Get the current partial object state
   */
  getPartialObject(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, section] of this.state.sections) {
      if (section.data !== undefined) {
        result[key] = section.data
      }
    }
    return result
  }

  /**
   * Get the full buffer
   */
  getBuffer(): string {
    return this.buffer
  }

  /**
   * Reset parser state for reuse
   */
  reset(): void {
    this.buffer = ''
    this.state = this.createInitialState()
    this.sectionIndex = 0
  }
}

/**
 * Simplified parser that detects complete top-level sections
 * Works by finding complete JSON objects at the top level
 */
export class SimpleStreamingParser {
  private buffer = ''
  private callbacks: StreamingParserCallbacks
  private knownSectionKeys: string[]
  private completedKeys = new Set<string>()
  private sectionIndex = 0

  constructor(sectionKeys: string[], callbacks: StreamingParserCallbacks) {
    this.knownSectionKeys = sectionKeys
    this.callbacks = callbacks
  }

  push(tokens: string): SectionCheckpoint[] {
    this.buffer += tokens
    const checkpoints: SectionCheckpoint[] = []

    // Try to parse complete sections
    for (const key of this.knownSectionKeys) {
      if (this.completedKeys.has(key)) continue

      const checkpoint = this.tryExtractSection(key)
      if (checkpoint) {
        checkpoints.push(checkpoint)
        this.callbacks.onSectionComplete(checkpoint)
      }
    }

    this.callbacks.onToken?.(tokens)
    return checkpoints
  }

  private tryExtractSection(key: string): SectionCheckpoint | null {
    // Find the key in the buffer
    const keyPattern = `"${key}"\\s*:\\s*`
    const keyMatch = this.buffer.match(new RegExp(keyPattern))
    if (!keyMatch || keyMatch.index === undefined) return null

    const keyStart = keyMatch.index + keyMatch[0].length
    
    // Find the value (object) that follows
    if (this.buffer[keyStart] !== '{') return null

    // Find matching closing brace
    let depth = 0
    let end = keyStart
    for (let i = keyStart; i < this.buffer.length; i++) {
      if (this.buffer[i] === '{') depth++
      else if (this.buffer[i] === '}') {
        depth--
        if (depth === 0) {
          end = i + 1
          break
        }
      }
    }

    if (end <= keyStart) return null

    // Extract and parse the section
    const jsonStr = this.buffer.slice(keyStart, end)
    try {
      const data = JSON.parse(jsonStr)
      this.completedKeys.add(key)
      return {
        key,
        data,
        index: this.sectionIndex++,
      }
    } catch {
      return null
    }
  }

  getCompletedSections(): string[] {
    return Array.from(this.completedKeys)
  }

  getBuffer(): string {
    return this.buffer
  }

  reset(): void {
    this.buffer = ''
    this.completedKeys.clear()
    this.sectionIndex = 0
  }
}

/**
 * Parse a complete JSON string and emit section checkpoints
 * Useful for post-processing non-streaming responses
 */
export function parseSectionsWithCallbacks(
  jsonString: string,
  sectionKeys: string[],
  onSection: (checkpoint: SectionCheckpoint) => void,
  delay: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    try {
      const full = JSON.parse(jsonString)
      let index = 0

      const emitNext = () => {
        if (index >= sectionKeys.length) {
          resolve()
          return
        }

        const key = sectionKeys[index]
        if (key && full[key] !== undefined) {
          onSection({
            key,
            data: full[key],
            index,
          })
        }
        index++

        if (delay > 0) {
          setTimeout(emitNext, delay)
        } else {
          emitNext()
        }
      }

      emitNext()
    } catch {
      resolve()
    }
  })
}
