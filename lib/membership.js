// Membership System Library
// Handles subscriptions, monthly credit refills, and credit expiry logic

import { connectToDatabase } from './mongodb'
import { v4 as uuidv4 } from 'uuid'

// Membership Plans Configuration
export const MEMBERSHIP_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    monthlyCredits: 50,
    features: [
      '50 starter credits (expires in 7 days)',
      'Basic content tools',
      'Watermarked exports',
      'Standard support'
    ],
    limits: {
      dailyGenerations: 5,
      maxVideoLength: 30, // seconds
      resolution: '720p',
      watermark: true
    }
  },
  creator: {
    id: 'creator',
    name: 'Creator',
    price: 19,
    priceYearly: 190, // ~$15.83/month
    monthlyCredits: 400,
    stripePriceId: 'price_1SxELzCCxH1bzQKtDFplHoXR',
    stripeYearlyPriceId: 'price_1SxERhCCxH1bzQKtSMHdTRpm',
    stripeProductId: 'prod_Tv4UBgyGt3TOjA',
    features: [
      '400 credits/month (non-rollover)',
      'All content tools',
      'No watermarks',
      'Priority rendering queue',
      'Bangla Voice Studio',
      '10% discount on extra credits',
      'Email support'
    ],
    limits: {
      dailyGenerations: 50,
      maxVideoLength: 60,
      resolution: '1080p',
      watermark: false
    },
    creditDiscount: 0.10 // 10% off purchased credits
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceYearly: 490, // ~$40.83/month
    monthlyCredits: 1000,
    stripePriceId: 'price_1SxEMjCCxH1bzQKtJhBCdTkj',
    stripeYearlyPriceId: 'price_1SxFKZCCxH1bzQKtNWNYMQgc',
    stripeProductId: 'prod_Tv4VU3QH2cWkov',
    features: [
      '1,000 credits/month (non-rollover)',
      'Everything in Creator',
      'Daily auto-reel generator',
      'Batch generation',
      'Shorts repurposing',
      'Early access to new tools',
      'Higher export quality (4K)',
      '20% discount on extra credits',
      'Priority support'
    ],
    limits: {
      dailyGenerations: 200,
      maxVideoLength: 180,
      resolution: '4k',
      watermark: false,
      batchGeneration: true,
      autoScheduling: true
    },
    creditDiscount: 0.20 // 20% off purchased credits
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 99,
    priceYearly: 990, // ~$82.50/month
    monthlyCredits: 3000,
    stripePriceId: 'price_1SxEPrCCxH1bzQKte0UCzu6Y',
    stripeYearlyPriceId: 'price_1SxFMHCCxH1bzQKteaVQk8jF',
    stripeProductId: 'prod_Tv4YCgQ27hQss8',
    features: [
      '3,000 credits/month (non-rollover)',
      'Everything in Pro',
      'Team access (up to 5 seats)',
      'Brand kits',
      'Client folders',
      'API access',
      'Bulk upload',
      '30% discount on extra credits',
      'Dedicated support'
    ],
    limits: {
      dailyGenerations: -1, // unlimited
      maxVideoLength: 600,
      resolution: '4k',
      watermark: false,
      batchGeneration: true,
      autoScheduling: true,
      teamSeats: 5,
      apiAccess: true
    },
    creditDiscount: 0.30 // 30% off purchased credits
  }
}

// Get membership plan details
export function getMembershipPlan(planId) {
  return MEMBERSHIP_PLANS[planId] || MEMBERSHIP_PLANS.free
}

// Get user's membership status
export async function getUserMembership(userId) {
  const { db } = await connectToDatabase()
  const user = await db.collection('users').findOne({ _id: userId })
  
  if (!user) {
    return {
      plan: 'free',
      planDetails: MEMBERSHIP_PLANS.free,
      membershipCredits: 0,
      purchasedCredits: 0,
      totalCredits: 0,
      subscriptionStatus: 'none',
      renewsAt: null
    }
  }
  
  const plan = getMembershipPlan(user.plan || 'free')
  
  return {
    plan: user.plan || 'free',
    planDetails: plan,
    membershipCredits: user.membershipCredits || 0, // Credits from subscription (don't rollover)
    purchasedCredits: user.purchasedCredits || 0,   // Credits from purchases (rollover)
    totalCredits: (user.membershipCredits || 0) + (user.purchasedCredits || 0),
    subscriptionStatus: user.subscriptionStatus || 'none',
    renewsAt: user.subscriptionRenewsAt || null,
    subscriptionId: user.stripeSubscriptionId || null,
    billingCycle: user.billingCycle || 'monthly'
  }
}

// Deduct credits with proper priority (membership first, then purchased)
export async function deductMembershipCredits(userId, amount, toolId, params = {}) {
  const { db } = await connectToDatabase()
  const user = await db.collection('users').findOne({ _id: userId })
  
  if (!user) {
    return { success: false, error: 'User not found' }
  }
  
  const membershipCredits = user.membershipCredits || 0
  const purchasedCredits = user.purchasedCredits || 0
  const totalCredits = membershipCredits + purchasedCredits
  
  if (totalCredits < amount) {
    return {
      success: false,
      error: 'Insufficient credits',
      required: amount,
      available: totalCredits
    }
  }
  
  // Deduct from membership credits first (they expire anyway)
  let deductFromMembership = Math.min(membershipCredits, amount)
  let deductFromPurchased = amount - deductFromMembership
  
  const transactionId = uuidv4()
  
  // Create transaction record
  await db.collection('credit_transactions').insertOne({
    _id: transactionId,
    userId,
    toolId,
    amount: -amount,
    membershipCreditsUsed: deductFromMembership,
    purchasedCreditsUsed: deductFromPurchased,
    status: 'pending',
    params,
    createdAt: new Date()
  })
  
  // Update user credits
  await db.collection('users').updateOne(
    { _id: userId },
    {
      $inc: {
        membershipCredits: -deductFromMembership,
        purchasedCredits: -deductFromPurchased,
        totalCreditsUsed: amount,
        generationsToday: 1
      },
      $set: { lastGenerationAt: new Date() }
    }
  )
  
  return {
    success: true,
    transactionId,
    cost: amount,
    membershipCreditsUsed: deductFromMembership,
    purchasedCreditsUsed: deductFromPurchased,
    newBalance: {
      membership: membershipCredits - deductFromMembership,
      purchased: purchasedCredits - deductFromPurchased,
      total: totalCredits - amount
    }
  }
}

// Refund credits (returns to proper bucket)
export async function refundMembershipCredits(transactionId, reason = 'Generation failed') {
  const { db } = await connectToDatabase()
  
  const transaction = await db.collection('credit_transactions').findOne({ _id: transactionId })
  
  if (!transaction) {
    return { success: false, error: 'Transaction not found' }
  }
  
  if (transaction.status !== 'pending') {
    return { success: false, error: 'Transaction already processed' }
  }
  
  const membershipRefund = transaction.membershipCreditsUsed || 0
  const purchasedRefund = transaction.purchasedCreditsUsed || 0
  
  // Update transaction
  await db.collection('credit_transactions').updateOne(
    { _id: transactionId },
    {
      $set: {
        status: 'refunded',
        refundReason: reason,
        completedAt: new Date()
      }
    }
  )
  
  // Refund to user
  await db.collection('users').updateOne(
    { _id: transaction.userId },
    {
      $inc: {
        membershipCredits: membershipRefund,
        purchasedCredits: purchasedRefund,
        totalCreditsUsed: -(membershipRefund + purchasedRefund),
        generationsToday: -1
      }
    }
  )
  
  return {
    success: true,
    refundedMembership: membershipRefund,
    refundedPurchased: purchasedRefund,
    reason
  }
}

// Add purchased credits (these rollover)
export async function addPurchasedCredits(userId, amount, reason, stripePaymentId = null) {
  const { db } = await connectToDatabase()
  
  const transactionId = uuidv4()
  
  await db.collection('credit_transactions').insertOne({
    _id: transactionId,
    userId,
    amount,
    type: 'purchase',
    creditType: 'purchased', // Important: marks as purchased (rollover)
    reason,
    stripePaymentId,
    status: 'completed',
    createdAt: new Date(),
    completedAt: new Date()
  })
  
  await db.collection('users').updateOne(
    { _id: userId },
    { $inc: { purchasedCredits: amount } }
  )
  
  return { success: true, transactionId, amount, type: 'purchased' }
}

// Refill monthly membership credits (called by webhook or cron)
export async function refillMembershipCredits(userId) {
  const { db } = await connectToDatabase()
  const user = await db.collection('users').findOne({ _id: userId })
  
  if (!user || !user.plan || user.plan === 'free') {
    return { success: false, error: 'No active subscription' }
  }
  
  const plan = getMembershipPlan(user.plan)
  
  // Reset membership credits to plan amount (NO rollover)
  const transactionId = uuidv4()
  
  await db.collection('credit_transactions').insertOne({
    _id: transactionId,
    userId,
    amount: plan.monthlyCredits,
    type: 'membership_refill',
    creditType: 'membership',
    reason: `Monthly ${plan.name} plan refill`,
    previousBalance: user.membershipCredits || 0,
    status: 'completed',
    createdAt: new Date(),
    completedAt: new Date()
  })
  
  // Calculate next renewal date
  const renewsAt = new Date()
  if (user.billingCycle === 'yearly') {
    renewsAt.setFullYear(renewsAt.getFullYear() + 1)
  } else {
    renewsAt.setMonth(renewsAt.getMonth() + 1)
  }
  
  await db.collection('users').updateOne(
    { _id: userId },
    {
      $set: {
        membershipCredits: plan.monthlyCredits, // Reset, not add
        subscriptionRenewsAt: renewsAt,
        lastRefillAt: new Date()
      }
    }
  )
  
  return {
    success: true,
    creditsRefilled: plan.monthlyCredits,
    plan: plan.name,
    renewsAt
  }
}

// Upgrade/change subscription
export async function changeSubscription(userId, newPlanId, billingCycle = 'monthly') {
  const { db } = await connectToDatabase()
  const newPlan = getMembershipPlan(newPlanId)
  
  if (!newPlan || newPlanId === 'free') {
    // Downgrade to free - keep purchased credits, remove membership credits
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          plan: 'free',
          membershipCredits: 0,
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
          subscriptionRenewsAt: null
        }
      }
    )
    return { success: true, plan: 'free' }
  }
  
  // Upgrade to paid plan
  const renewsAt = new Date()
  if (billingCycle === 'yearly') {
    renewsAt.setFullYear(renewsAt.getFullYear() + 1)
  } else {
    renewsAt.setMonth(renewsAt.getMonth() + 1)
  }
  
  await db.collection('users').updateOne(
    { _id: userId },
    {
      $set: {
        plan: newPlanId,
        membershipCredits: newPlan.monthlyCredits,
        subscriptionStatus: 'active',
        subscriptionRenewsAt: renewsAt,
        billingCycle,
        planActivatedAt: new Date()
      }
    }
  )
  
  // Log the upgrade
  await db.collection('credit_transactions').insertOne({
    _id: uuidv4(),
    userId,
    amount: newPlan.monthlyCredits,
    type: 'subscription_start',
    creditType: 'membership',
    reason: `Started ${newPlan.name} ${billingCycle} subscription`,
    status: 'completed',
    createdAt: new Date(),
    completedAt: new Date()
  })
  
  return {
    success: true,
    plan: newPlanId,
    creditsAdded: newPlan.monthlyCredits,
    renewsAt
  }
}

// Check feature access based on plan
export function checkFeatureAccess(planId, feature) {
  const plan = getMembershipPlan(planId)
  
  switch (feature) {
    case 'watermark':
      return !plan.limits.watermark
    case 'batch':
      return plan.limits.batchGeneration === true
    case 'api':
      return plan.limits.apiAccess === true
    case '4k':
      return plan.limits.resolution === '4k'
    case 'scheduling':
      return plan.limits.autoScheduling === true
    default:
      return true
  }
}

// Get credit discount for plan
export function getCreditDiscount(planId) {
  const plan = getMembershipPlan(planId)
  return plan.creditDiscount || 0
}
