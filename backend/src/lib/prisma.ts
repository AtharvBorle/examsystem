import { PrismaClient } from '@prisma/client'
import { initAnonymizeCron } from './cron-scheduler'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Initialize midnight account anonymization scheduler with Postgres Advisory Lock
try {
  initAnonymizeCron()
} catch (e) {
  console.error('Failed to init cron scheduler:', e)
}
