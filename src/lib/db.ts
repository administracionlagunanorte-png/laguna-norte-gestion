import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Mismo patrón que el sistema de escritorio:
// connection_limit=1 y pool_timeout=60 para Aiven free tier
// (aumentado a 60s porque el free tier tiene muy pocas conexiones)
const databaseUrl = process.env.DATABASE_URL || ''
const connectionString = databaseUrl.includes('?')
  ? databaseUrl + (databaseUrl.includes('connection_limit') ? '' : '&connection_limit=1&pool_timeout=60')
  : databaseUrl + '?connection_limit=1&pool_timeout=60'

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
// Aumentado a 5 reintentos con backoff exponencial más largo para manejar
// el error "Too many database connections opened" de Aiven free tier.
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelayMs: number = 300
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error
      const err = error as { code?: string; message?: string }

      // Errores de Prisma que son reintentables
      const isPrismaRetryable =
        err?.code === 'P1001' || err?.code === 'P1002' || err?.code === 'P1017' ||
        err?.code === 'P2024' || err?.code === 'P5010'

      // Errores de PostgreSQL que son reintentables
      // "Too many database connections opened"
      // "remaining connection slots are reserved for roles with the SUPERUSER attribute"
      // "FATAL: sorry, too many clients already"
      // "could not establish a connection"
      const isPgRetryable =
        err?.message && (
          err.message.includes('Connection refused') ||
          err.message.includes('Connection terminated') ||
          err.message.includes('Timed out') ||
          err.message.includes('timeout') ||
          err.message.includes('ECONNRESET') ||
          err.message.includes('ETIMEDOUT') ||
          err.message.includes('Too many database connections') ||
          err.message.includes('remaining connection slots') ||
          err.message.includes('too many clients already') ||
          err.message.includes('could not establish a connection') ||
          err.message.includes('connection slot') ||
          err.message.includes('no more connections')
        )

      const isRetryable = isPrismaRetryable || isPgRetryable

      if (!isRetryable || attempt === maxRetries) throw error

      // Backoff exponencial: 300ms, 600ms, 1200ms, 2400ms, 4800ms
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      console.warn(`[withRetry] Intento ${attempt}/${maxRetries} falló, reintentando en ${delay}ms...`, err?.code, err?.message?.substring(0, 100))
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
