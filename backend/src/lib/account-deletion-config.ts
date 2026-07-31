/**
 * Utility helper to retrieve the account deletion grace period (in minutes) from environment variables.
 * Defaults to 30 days (43,200 minutes) if ACCOUNT_DELETION_GRACE_MINUTES is not specified in .env.
 * For 5 minute testing, set ACCOUNT_DELETION_GRACE_MINUTES=5 in .env file.
 */
export function getAccountDeletionGraceMinutes(): number {
  const envVal = process.env.ACCOUNT_DELETION_GRACE_MINUTES || process.env.ACCOUNT_DELETION_MINUTES
  if (envVal) {
    const parsed = parseInt(envVal, 10)
    if (!isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  return 30 * 24 * 60 // 30 days default in minutes
}

/**
 * Calculates the cutoff Date threshold. Any account soft-deleted at or before
 * this threshold Date is eligible for permanent anonymization.
 */
export function getAccountDeletionThresholdDate(): Date {
  const graceMinutes = getAccountDeletionGraceMinutes()
  return new Date(Date.now() - graceMinutes * 60 * 1000)
}

/**
 * Returns a human-readable display string for the grace period (e.g. "5 minute(s)", "2 hour(s)", "30 days").
 */
export function getAccountDeletionGraceDisplayString(): string {
  const minutes = getAccountDeletionGraceMinutes()
  if (minutes < 60) {
    return `${minutes} minute(s)`
  }
  if (minutes < 24 * 60) {
    const hours = Math.round(minutes / 60)
    return `${hours} hour(s)`
  }
  const days = Math.round(minutes / (24 * 60))
  return `${days} days`
}

/**
 * Determines the node-cron schedule expression.
 * 1. If explicit ANONYMIZE_CRON_SCHEDULE or ACCOUNT_DELETION_CRON_SCHEDULE is set in process.env, use it.
 * 2. If ACCOUNT_DELETION_GRACE_MINUTES is < 60 (short testing period like 5 or 10 mins), run every 1 minute ('* * * * *').
 * 3. Otherwise (30 days, 1 day, etc.), run daily at midnight ('0 0 * * *').
 */
export function getAnonymizeCronSchedule(): string {
  const explicitSchedule = process.env.ANONYMIZE_CRON_SCHEDULE || process.env.ACCOUNT_DELETION_CRON_SCHEDULE
  if (explicitSchedule && explicitSchedule.trim()) {
    return explicitSchedule.trim()
  }

  const graceMinutes = getAccountDeletionGraceMinutes()
  if (graceMinutes < 60) {
    // For short testing intervals (< 1 hour), check every minute
    return '* * * * *'
  }

  // Default: daily at midnight (00:00)
  return '0 0 * * *'
}
