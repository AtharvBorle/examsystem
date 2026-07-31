import cron from 'node-cron'
import { prisma } from './prisma'
import { getAccountDeletionThresholdDate, getAccountDeletionGraceDisplayString } from './account-deletion-config'

const ADVISORY_LOCK_ID = BigInt('884729103847219')

let isInitialized = false

export function initAnonymizeCron() {
  if (isInitialized) return
  isInitialized = true

  // Schedule task to run every midnight at 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('[MIDNIGHT CRON] Triggered account anonymization check...')
    try {
      // Try acquiring Postgres Advisory Lock across cluster workers
      const lockResult: any[] = await prisma.$queryRaw`SELECT pg_try_advisory_lock(${ADVISORY_LOCK_ID}) as acquired;`
      const acquired = lockResult[0]?.acquired === true

      if (!acquired) {
        console.log('[MIDNIGHT CRON] Postgres Advisory Lock held by another cluster worker. Skipping execution.')
        return
      }

      try {
        const displayTime = getAccountDeletionGraceDisplayString()
        console.log(`[MIDNIGHT CRON] Lock acquired. Executing expired account anonymization (retention: ${displayTime})...`)
        const thresholdDate = getAccountDeletionThresholdDate()

        const expiredStudents = await prisma.student.findMany({
          where: {
            deletedAt: {
              lte: thresholdDate,
              not: null
            },
            NOT: {
              name: 'Anonymized User'
            }
          },
          select: {
            id: true
          }
        })

        let count = 0
        for (const student of expiredStudents) {
          await prisma.student.update({
            where: { id: student.id },
            data: {
              name: 'Anonymized User',
              mobile: `DELETED_${student.id}`,
              password: 'ANONYMIZED_DELETED_ACCOUNT',
              district: 'ANONYMIZED',
              tehsil: 'ANONYMIZED'
            }
          })
          count++
        }

        console.log(`[MIDNIGHT CRON] Complete. Anonymized ${count} expired user account(s).`)
      } finally {
        await prisma.$queryRaw`SELECT pg_advisory_unlock(${ADVISORY_LOCK_ID});`
        console.log('[MIDNIGHT CRON] Postgres Advisory Lock released.')
      }
    } catch (err) {
      console.error('[MIDNIGHT CRON] Error executing account anonymization:', err)
    }
  })

  console.log('[CRON INITIALIZED] Daily midnight account anonymization scheduled (00:00) with Postgres Advisory Locking.')
}
