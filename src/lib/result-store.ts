import fs from 'fs/promises'
import path from 'path'
import type { ValidationReport, ValidationResult } from '@/types/validation'

interface StoredResult {
  id: string
  data: ValidationReport
  createdAt: number
  ownerId?: string
  isPublic?: boolean
  partialFailures?: ValidationResult['partialFailures']
  phaseErrors?: ValidationResult['phases']
}

const RESULTS_DIR = path.join(process.cwd(), '.results')
const MAX_AGE_MS = 60 * 60 * 1000 // 1 hour

async function ensureResultsDir(): Promise<void> {
  try {
    await fs.mkdir(RESULTS_DIR, { recursive: true })
  } catch (error) {
    console.error('[result-store] Failed to create results directory:', error)
  }
}

async function getFilePath(id: string): Promise<string> {
  return path.join(RESULTS_DIR, `${id}.json`)
}

export function generateResultId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

export async function storeResult(data: ValidationReport, extra?: {
  ownerId?: string
  isPublic?: boolean
  partialFailures?: ValidationResult['partialFailures']
  phases?: ValidationResult['phases']
}): Promise<string> {
  await ensureResultsDir()

  const id = generateResultId()
  const filePath = await getFilePath(id)

  const stored: StoredResult = {
    id,
    data,
    createdAt: Date.now(),
    ...(extra?.ownerId && { ownerId: extra.ownerId }),
    ...(extra?.isPublic !== undefined && { isPublic: extra.isPublic }),
    ...(extra?.partialFailures && { partialFailures: extra.partialFailures }),
    ...(extra?.phases && { phaseErrors: extra.phases }),
  }
  
  await fs.writeFile(filePath, JSON.stringify(stored), 'utf-8')
  console.log(`[result-store] Stored: ${id}`)
  
  // Clean up old files
  await cleanupOldResults()
  
  return id
}

export async function getResult(id: string): Promise<ValidationReport | null> {
  const filePath = await getFilePath(id)
  
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const stored: StoredResult = JSON.parse(content)
    
    // Check expiration
    if (Date.now() - stored.createdAt > MAX_AGE_MS) {
      console.log(`[result-store] Expired: ${id}`)
      await fs.unlink(filePath).catch(() => {})
      return null
    }
    
    console.log(`[result-store] Retrieved: ${id}`)
    return stored.data
  } catch {
    console.log(`[result-store] Not found: ${id}`)
    return null
  }
}

export async function deleteResult(id: string): Promise<boolean> {
  const filePath = await getFilePath(id)
  try {
    await fs.unlink(filePath)
    return true
  } catch {
    return false
  }
}

async function cleanupOldResults(): Promise<void> {
  try {
    const files = await fs.readdir(RESULTS_DIR)
    const now = Date.now()
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      
      try {
        const filePath = path.join(RESULTS_DIR, file)
        const stat = await fs.stat(filePath)
        const age = now - stat.mtimeMs
        
        if (age > MAX_AGE_MS) {
          await fs.unlink(filePath)
          console.log(`[result-store] Cleaned up expired: ${file}`)
        }
      } catch {
        // Ignore individual file errors
      }
    }
  } catch {
    // Directory doesn't exist or other error
  }
}

export async function getStoreStats(): Promise<{ size: number; ids: string[] }> {
  try {
    await ensureResultsDir()
    const files = await fs.readdir(RESULTS_DIR)
    const ids = files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
    return { size: ids.length, ids }
  } catch {
    return { size: 0, ids: [] }
  }
}

export async function setOwner(resultId: string, ownerId: string): Promise<boolean> {
  const filePath = await getFilePath(resultId)
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const stored: StoredResult = JSON.parse(content)
    stored.ownerId = ownerId
    await fs.writeFile(filePath, JSON.stringify(stored), 'utf-8')
    return true
  } catch {
    return false
  }
}

export async function getResultsByOwner(ownerId: string): Promise<StoredResult[]> {
  await ensureResultsDir()
  try {
    const files = await fs.readdir(RESULTS_DIR)
    const results: StoredResult[] = []
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const filePath = path.join(RESULTS_DIR, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const stored: StoredResult = JSON.parse(content)
        if (stored.ownerId === ownerId && Date.now() - stored.createdAt <= MAX_AGE_MS) {
          results.push(stored)
        }
      } catch {
        // Ignore individual file errors
      }
    }
    return results.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}
