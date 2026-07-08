import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Mismo patrón que el sistema de escritorio:
// connection_limit=1 y pool_timeout=30 para Aiven free tier
const databaseUrl = process.env.DATABASE_URL || ''
const connectionString = databaseUrl.includes('?')
  ? databaseUrl + (databaseUrl.includes('connection_limit') ? '' : '&connection_limit=1&pool_timeout=30')
  : databaseUrl + '?connection_limit=1&pool_timeout=30'

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: connectionString,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}

// Helper de reintentos (mismo que sistema principal)
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 200
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error
      const err = error as { code?: string; message?: string }
      const isRetryable =
        err?.code === 'P1001' || err?.code === 'P1002' || err?.code === 'P1017' ||
        err?.code === 'P2024' || err?.code === 'P5010' ||
        (err?.message && (
          err.message.includes('Connection refused') ||
          err.message.includes('Connection terminated') ||
          err.message.includes('Timed out') ||
          err.message.includes('timeout') ||
          err.message.includes('ECONNRESET') ||
          err.message.includes('ETIMEDOUT')
        ))
      if (!isRetryable || attempt === maxRetries) throw error
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
