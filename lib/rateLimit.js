// Rate Limiting Library
// Prevents abuse by limiting API calls

import { connectToDatabase } from './mongodb'

// Rate limit configurations per plan
const RATE_LIMITS = {
  free: {
    generationsPerMinute: 5,
    generationsPerHour: 20,
    generationsPerDay: 50,
    concurrentGenerations: 1,
    maxVideoLength: 30,      // seconds
    maxExportsPerDay: 5
  },
  creator: {
    generationsPerMinute: 15,
    generationsPerHour: 100,
    generationsPerDay: 500,
    concurrentGenerations: 3,
    maxVideoLength: 120,
    maxExportsPerDay: 30
  },
  pro: {
    generationsPerMinute: 30,
    generationsPerHour: 300,
    generationsPerDay: 2000,
    concurrentGenerations: 5,
    maxVideoLength: 300,
    maxExportsPerDay: 100
  },
  business: {
    generationsPerMinute: 60,
    generationsPerHour: 1000,
    generationsPerDay: 10000,
    concurrentGenerations: 10,
    maxVideoLength: 600,
    maxExportsPerDay: -1  // unlimited
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
  
  // Get user's rate limit data
  const user = await db.collection('users').findOne({ _id: userId })
  const rateLimitData = await db.collection('rate_limits').findOne({ userId })
  
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
