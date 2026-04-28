// Rate Limiting Library
// Prevents abuse by limiting API calls

import { connectToDatabase } from './mongodb'

// Rate limit configurations per plan
const RATE_LIMITS = {
  free: {
    generationsPerMinute: 20,     // Increased for better UX
    generationsPerHour: 100,
    generationsPerDay: 200,
    concurrentGenerations: 10,    // Increased significantly - no blocking users
    maxVideoLength: 60,           // seconds
    maxExportsPerDay: 20
  },
  creator: {
    generationsPerMinute: 30,
    generationsPerHour: 200,
    generationsPerDay: 1000,
    concurrentGenerations: 10,
    maxVideoLength: 180,
    maxExportsPerDay: 100
  },
  pro: {
    generationsPerMinute: 50,
    generationsPerHour: 500,
    generationsPerDay: 5000,
    concurrentGenerations: 10,
    maxVideoLength: 600,
    maxExportsPerDay: -1  // unlimited
  },
  business: {
    generationsPerMinute: 100,
    generationsPerHour: 2000,
    generationsPerDay: 20000,
    concurrentGenerations: 10,
    maxVideoLength: 1200,
    maxExportsPerDay: -1  // unlimited
  },
  // Aliases for compatibility
  basic: {
    generationsPerMinute: 30,
    generationsPerHour: 200,
    generationsPerDay: 1000,
    concurrentGenerations: 10,
    maxVideoLength: 180,
    maxExportsPerDay: 100
  },
  premium: {
    generationsPerMinute: 50,
    generationsPerHour: 500,
    generationsPerDay: 5000,
    concurrentGenerations: 10,
    maxVideoLength: 600,
    maxExportsPerDay: -1
  }
}

// Check if user is rate limited
export async function checkRateLimit(userId, plan = 'free') {
  const { db } = await connectToDatabase()
  const limits = RATE_LIMITS[plan] || RATE_LIMITS.free
  
  const now = new Date()
  const oneMinuteAgo = new Date(now - 60 * 1000)
  const oneHourAgo = new Date(now - 60 * 60 * 1000)
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000)
  const tenMinutesAgo = new Date(now - 10 * 60 * 1000)
  
  // Get user's rate limit data
  const user = await db.collection('users').findOne({ _id: userId })
  const rateLimitData = await db.collection('rate_limits').findOne({ userId })
  
  // AUTO-CLEANUP: Reset stuck concurrent generations (started > 10 min ago without ending)
  if (rateLimitData && rateLimitData.concurrentGenerations > 0) {
    const lastStart = rateLimitData.lastGenerationStart ? new Date(rateLimitData.lastGenerationStart) : null
    const lastEnd = rateLimitData.lastGenerationEnd ? new Date(rateLimitData.lastGenerationEnd) : null
    
    // If generation started more than 10 minutes ago and hasn't ended after that, reset
    if (lastStart && lastStart < tenMinutesAgo && (!lastEnd || lastEnd < lastStart)) {
      await db.collection('rate_limits').updateOne(
        { userId },
        { $set: { concurrentGenerations: 0 } }
      )
      // Update local variable
      rateLimitData.concurrentGenerations = 0
    }
  }
  
  // Count recent generations
  const recentGenerations = await db.collection('credit_transactions')
    .countDocuments({
      userId,
      createdAt: { $gte: oneMinuteAgo },
      type: { $ne: 'credit_add' }
    })
  
  const hourlyGenerations = await db.collection('credit_transactions')
    .countDocuments({
      userId,
      createdAt: { $gte: oneHourAgo },
      type: { $ne: 'credit_add' }
    })
  
  const dailyGenerations = user?.generationsToday || 0
  const concurrentGenerations = rateLimitData?.concurrentGenerations || 0
  
  // Check limits
  if (recentGenerations >= limits.generationsPerMinute) {
    return {
      allowed: false,
      reason: 'Too many requests. Please wait a minute.',
      retryAfter: 60,
      limit: 'minute'
    }
  }
  
  if (hourlyGenerations >= limits.generationsPerHour) {
    return {
      allowed: false,
      reason: 'Hourly limit reached. Please try again later.',
      retryAfter: 3600,
      limit: 'hour'
    }
  }
  
  if (dailyGenerations >= limits.generationsPerDay) {
    return {
      allowed: false,
      reason: 'Daily limit reached. Upgrade your plan for more.',
      retryAfter: 86400,
      limit: 'day'
    }
  }
  
  if (concurrentGenerations >= limits.concurrentGenerations) {
    return {
      allowed: false,
      reason: 'Too many concurrent generations. Please wait for current ones to complete.',
      retryAfter: 30,
      limit: 'concurrent'
    }
  }
  
  return { allowed: true }
}

// Increment concurrent generation counter
export async function startGeneration(userId) {
  const { db } = await connectToDatabase()
  
  await db.collection('rate_limits').updateOne(
    { userId },
    { 
      $inc: { concurrentGenerations: 1 },
      $set: { lastGenerationStart: new Date() }
    },
    { upsert: true }
  )
}

// Decrement concurrent generation counter
export async function endGeneration(userId) {
  const { db } = await connectToDatabase()
  
  await db.collection('rate_limits').updateOne(
    { userId },
    { 
      $inc: { concurrentGenerations: -1 },
      $set: { lastGenerationEnd: new Date() }
    }
  )
  
  // Ensure concurrent count doesn't go negative
  await db.collection('rate_limits').updateOne(
    { userId, concurrentGenerations: { $lt: 0 } },
    { $set: { concurrentGenerations: 0 } }
  )
}

// Get rate limit info for user
export async function getRateLimitInfo(userId, plan = 'free') {
  const { db } = await connectToDatabase()
  const limits = RATE_LIMITS[plan] || RATE_LIMITS.free
  
  const user = await db.collection('users').findOne({ _id: userId })
  const rateLimitData = await db.collection('rate_limits').findOne({ userId })
  
  return {
    plan,
    limits,
    current: {
      generationsToday: user?.generationsToday || 0,
      concurrentGenerations: rateLimitData?.concurrentGenerations || 0
    },
    remaining: {
      daily: limits.generationsPerDay - (user?.generationsToday || 0),
      concurrent: limits.concurrentGenerations - (rateLimitData?.concurrentGenerations || 0)
    }
  }
}

// Reset daily counters (run via cron job at midnight)
export async function resetDailyCounters() {
  const { db } = await connectToDatabase()
  
  await db.collection('users').updateMany(
    {},
    { $set: { generationsToday: 0 } }
  )
  
  return { success: true }
}

// Detect suspicious activity
export async function detectSuspiciousActivity(userId) {
  const { db } = await connectToDatabase()
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  
  // Check for many failed generations
  const failedGenerations = await db.collection('credit_transactions')
    .countDocuments({
      userId,
      status: 'refunded',
      createdAt: { $gte: oneHourAgo }
    })
  
  // Check for rapid credit drain
  const user = await db.collection('users').findOne({ _id: userId })
  const accountAge = Date.now() - new Date(user?.createdAt || 0).getTime()
  const accountAgeHours = accountAge / (1000 * 60 * 60)
  
  const suspicious = {
    tooManyFailures: failedGenerations > 10,
    rapidDrain: accountAgeHours < 1 && (user?.totalCreditsUsed || 0) > 40,
    flagged: false,
    reasons: []
  }
  
  if (suspicious.tooManyFailures) {
    suspicious.flagged = true
    suspicious.reasons.push('Too many failed generations in the last hour')
  }
  
  if (suspicious.rapidDrain) {
    suspicious.flagged = true
    suspicious.reasons.push('Rapid credit drain on new account')
  }
  
  // Auto-flag if suspicious
  if (suspicious.flagged) {
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          suspiciousActivity: true,
          suspiciousReasons: suspicious.reasons,
          flaggedAt: new Date()
        }
      }
    )
  }
  
  return suspicious
}
