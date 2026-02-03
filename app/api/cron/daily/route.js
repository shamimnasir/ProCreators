// Cron Job API - Daily Tasks
// Run via external cron service (e.g., cron-job.org, Vercel Cron, etc.)
// Endpoint: GET /api/cron/daily?secret=YOUR_CRON_SECRET

import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { autoAdjustPricing } from '@/lib/cost-tracking'
import { refillMembershipCredits, MEMBERSHIP_PLANS } from '@/lib/membership'
import { v4 as uuidv4 } from 'uuid'

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET || 'default-cron-secret-change-me'
  return secret === expectedSecret
}

export async function GET(request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    timestamp: new Date().toISOString(),
    tasks: []
  }

  try {
    const { db } = await connectToDatabase()

    // Task 1: Process subscription renewals
    const renewalResult = await processSubscriptionRenewals(db)
    results.tasks.push({ name: 'subscription_renewals', ...renewalResult })

    // Task 2: Expire free trial credits (7 days old)
    const expiryResult = await expireFreeCredits(db)
    results.tasks.push({ name: 'expire_free_credits', ...expiryResult })

    // Task 3: Auto-adjust pricing based on costs (dry run by default)
    const pricingResult = await autoAdjustPricing(true) // Set to false to actually adjust
    results.tasks.push({ name: 'auto_pricing', ...pricingResult })

    // Task 4: Reset daily generation counters
    const resetResult = await resetDailyCounters(db)
    results.tasks.push({ name: 'reset_daily_counters', ...resetResult })

    // Task 5: Send low credit alerts
    const alertResult = await sendLowCreditAlerts(db)
    results.tasks.push({ name: 'low_credit_alerts', ...alertResult })

    // Log cron run
    await db.collection('cron_logs').insertOne({
      _id: uuidv4(),
      type: 'daily',
      results,
      createdAt: new Date()
    })

    return NextResponse.json({ success: true, results })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Process subscription renewals (for users whose subscription renews today)
async function processSubscriptionRenewals(db) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Find users whose subscription renews today
  const usersToRenew = await db.collection('users').find({
    subscriptionStatus: 'active',
    subscriptionRenewsAt: { $gte: today, $lt: tomorrow }
  }).toArray()

  let renewed = 0
  let failed = 0

  for (const user of usersToRenew) {
    try {
      // In production, Stripe webhook handles the actual payment
      // This is just for credit refill after successful payment
      await refillMembershipCredits(user._id)
      renewed++
    } catch (error) {
      console.error(`Failed to renew for user ${user._id}:`, error)
      failed++
    }
  }

  return { renewed, failed, total: usersToRenew.length }
}

// Expire free trial credits older than 7 days
async function expireFreeCredits(db) {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() - 7)

  // Find users with expired free credits
  const result = await db.collection('users').updateMany(
    {
      plan: 'free',
      freeCreditsExpiry: { $lt: new Date() },
      membershipCredits: { $gt: 0 }
    },
    {
      $set: { membershipCredits: 0 },
      $push: {
        notifications: {
          type: 'credits_expired',
          message: 'Your free trial credits have expired. Upgrade to continue creating!',
          createdAt: new Date()
        }
      }
    }
  )

  return { expired: result.modifiedCount }
}

// Reset daily generation counters at midnight
async function resetDailyCounters(db) {
  const result = await db.collection('users').updateMany(
    { generationsToday: { $gt: 0 } },
    { $set: { generationsToday: 0 } }
  )

  return { reset: result.modifiedCount }
}

// Send alerts to users with low credits
async function sendLowCreditAlerts(db) {
  // Find active users with credits below 20 (and haven't been notified in 3 days)
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const lowCreditUsers = await db.collection('users').find({
    $or: [
      { membershipCredits: { $gt: 0, $lt: 20 } },
      { purchasedCredits: { $gt: 0, $lt: 20 } }
    ],
    accountStatus: 'active',
    $or: [
      { lastLowCreditAlert: { $lt: threeDaysAgo } },
      { lastLowCreditAlert: { $exists: false } }
    ]
  }).toArray()

  let notified = 0

  for (const user of lowCreditUsers) {
    try {
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: { lastLowCreditAlert: new Date() },
          $push: {
            notifications: {
              type: 'low_credits',
              message: 'Your credits are running low! Top up to keep creating amazing content.',
              createdAt: new Date()
            }
          }
        }
      )
      notified++

      // TODO: Send email notification via Mailgun
      // await sendLowCreditEmail(user.email, user.name, totalCredits)

    } catch (error) {
      console.error(`Failed to notify user ${user._id}:`, error)
    }
  }

  return { notified, total: lowCreditUsers.length }
}
