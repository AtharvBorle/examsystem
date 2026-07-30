import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 64-bit bigint lock key for user anonymization across cluster nodes
const ADVISORY_LOCK_ID = BigInt('884729103847219')

export async function POST(req: NextRequest) {
  return handleAnonymization(req)
}

export async function GET(req: NextRequest) {
  return handleAnonymization(req)
}

async function handleAnonymization(req: NextRequest) {
  try {
    // Optional secret key authorization check
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try acquiring Postgres Advisory Lock across cluster nodes
    // In a 4-core cluster, only 1 worker returns acquired = true, others return false and skip execution
    const lockResult: any[] = await prisma.$queryRaw`SELECT pg_try_advisory_lock(${ADVISORY_LOCK_ID}) as acquired;`
    const acquired = lockResult[0]?.acquired === true

    if (!acquired) {
      console.log('[ANONYMIZE CRON] Postgres Advisory Lock active on another cluster node. Skipping duplicate run.')
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Lock active on another cluster node. Skipping duplicate execution.'
      })
    }

    try {
      console.log('[ANONYMIZE CRON] Acquired lock. Running daily midnight user anonymization...')
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      // Find all students soft-deleted >= 30 days ago that have not yet been anonymized
      const expiredStudents = await prisma.student.findMany({
        where: {
          deletedAt: {
            lte: thirtyDaysAgo,
            not: null
          },
          NOT: {
            name: 'Anonymized User'
          }
        },
        select: {
          id: true,
          mobile: true
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

      console.log(`[ANONYMIZE CRON] Finished. ${count} expired user record(s) anonymized.`)
      return NextResponse.json({
        success: true,
        anonymizedCount: count,
        message: `Anonymization complete. ${count} expired user record(s) anonymized.`
      })
    } finally {
      // Always release the PostgreSQL advisory lock when finished
      await prisma.$queryRaw`SELECT pg_advisory_unlock(${ADVISORY_LOCK_ID});`
      console.log('[ANONYMIZE CRON] Postgres Advisory Lock released.')
    }
  } catch (error: any) {
    console.error('[ANONYMIZE CRON] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
