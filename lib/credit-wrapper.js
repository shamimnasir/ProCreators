// Credit-aware generation wrapper
// Use this to wrap any generation API call with credit deduction/refund

const DEMO_USER_ID = 'demo-user-001'

/**
 * Wrapper for credit-aware API generation
 * Handles credit check, deduction, and refund on failure
 */
export async function withCredits(toolId, generateFn, params = {}) {
  const userId = params.userId || DEMO_USER_ID
  let transactionId = null
  
  try {
    // Check and deduct credits
    const deductRes = await fetch('/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deduct',
        userId,
        toolId,
        params
      })
    })
    
    const deductData = await deductRes.json()
    
    if (!deductData.success) {
      return {
        success: false,
        error: deductData.error || 'Insufficient credits',
        needsCredits: true,
        shortfall: deductData.required - deductData.available
      }
    }
    
    transactionId = deductData.transactionId
    
    // Execute the generation
    const result = await generateFn()
    
    if (result.success) {
      // Complete the transaction
      await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          transactionId,
          userId
        })
      })
      
      return {
        ...result,
        creditsUsed: deductData.cost,
        newBalance: deductData.newBalance
      }
    } else {
      // Refund on failure
      await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refund',
          transactionId,
          userId,
          reason: result.error || 'Generation failed'
        })
      })
      
      return {
        ...result,
        creditsRefunded: true
      }
    }
    
  } catch (error) {
    // Refund on exception
    if (transactionId) {
      await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refund',
          transactionId,
          userId: params.userId || DEMO_USER_ID,
          reason: error.message
        })
      })
    }
    
    return {
      success: false,
      error: error.message,
      creditsRefunded: !!transactionId
    }
  }
}

/**
 * Get credit cost for a tool
 */
export async function getToolCost(toolId) {
  try {
    const res = await fetch(`/api/credits?toolId=${toolId}`)
    const data = await res.json()
    return data.costEstimate || 20 // Default cost
  } catch {
    return 20
  }
}

/**
 * Check if user has enough credits
 */
export async function checkCredits(toolId, userId = DEMO_USER_ID) {
  try {
    const res = await fetch('/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'check',
        userId,
        toolId
      })
    })
    return await res.json()
  } catch {
    return { hasEnough: false, error: 'Failed to check credits' }
  }
}
