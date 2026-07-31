import cron from 'node-cron'
import { prisma } from './prisma'
import { getAccountDeletionThresholdDate, getAccountDeletionGraceDisplayString, getAnonymizeCronSchedule } from './account-deletion-config'

const ADVISORY_LOCK_ID = BigInt('884729103847219')

let isInitialized = false

export function initAnonymizeCron() {
  if (isInitialized) return
  isInitialized = true

  const schedule = getAnonymizeCronSchedule()

  // Schedule task according to configured schedule
  cron.schedule(schedule, async () => {
    console.log(`[ANONYMIZE CRON] Triggered account anonymization check (schedule: '${schedule}')...`)
    try {
      // Try acquiring Postgres Advisory Lock across cluster workers
      const lockResult: any[] = await prisma.$queryRaw`SELECT pg_try_advisory_lock(${ADVISORY_LOCK_ID}) as acquired;`
      const acquired = lockResult[0]?.acquired === true

      if (!acquired) {
        console.log('[ANONYMIZE CRON] Postgres Advisory Lock held by another cluster worker. Skipping execution.')
        return
      }

      try {
        const displayTime = getAccountDeletionGraceDisplayString()
        console.log(`[ANONYMIZE CRON] Lock acquired. Executing expired account anonymization (retention: ${displayTime})...`)
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

        console.log(`[ANONYMIZE CRON] Complete. Anonymized ${count} expired user account(s).`)
      } finally {
        await prisma.$queryRaw`SELECT pg_advisory_unlock(${ADVISORY_LOCK_ID});`
        console.log('[ANONYMIZE CRON] Postgres Advisory Lock released.')
      }
    } catch (err) {
      console.error('[ANONYMIZE CRON] Error executing account anonymization:', err)
    }
  })

  console.log(`[CRON INITIALIZED] Account anonymization scheduled with pattern: '${schedule}' with Postgres Advisory Locking.`)
}
