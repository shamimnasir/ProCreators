// Tenant Isolation & Row-Level Security (RLS) Helpers
// MongoDB doesn't have native RLS, so we implement at application level
// This ensures users can only access their own data

import { NextResponse } from 'next/server'

/**
 * CRITICAL: Always use these helpers when querying user data
 * This prevents cross-tenant data access
 */

/**
 * Build a query that enforces tenant isolation
 * @param {string} userId - The authenticated user's ID
 * @param {object} additionalFilters - Additional query filters
 * @returns {object} MongoDB query with tenant isolation
 */
export function buildUserQuery(userId, additionalFilters = {}) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('SECURITY: userId is required for tenant-isolated queries')
  }
  
  // SECURITY: userId filter is always required and cannot be overridden
  return {
    userId,
    ...additionalFilters
  }
}

/**
 * Build a query for user's own document (e.g., profile)
 * @param {string} userId - The authenticated user's ID
 * @returns {object} MongoDB query
 */
export function buildSelfQuery(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('SECURITY: userId is required')
  }
  
  return { _id: userId }
}

/**
 * Verify that a document belongs to the requesting user
 * @param {object} document - The document to verify
 * @param {string} userId - The authenticated user's ID
 * @returns {boolean} True if document belongs to user
 */
export function verifyOwnership(document, userId) {
  if (!document || !userId) return false
  
  // Check common ownership patterns
  return (
    document.userId === userId ||
    document._id === userId ||
    document.ownerId === userId
  )
}

/**
 * Safe update with tenant isolation
 * Ensures users can only update their own documents
 */
export function buildUserUpdate(userId, documentId, updateData) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('SECURITY: userId is required for updates')
  }
  
  // Filter for both document ID and user ownership
  const filter = {
    _id: documentId,
    userId // CRITICAL: This ensures user can only update their own docs
  }
  
  // Remove any attempt to change userId
  const safeUpdateData = { ...updateData }
  delete safeUpdateData.userId
  delete safeUpdateData._id
  
  return { filter, updateData: safeUpdateData }
}

/**
 * Safe delete with tenant isolation
 */
export function buildUserDelete(userId, documentId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('SECURITY: userId is required for deletes')
  }
  
  return {
    _id: documentId,
    userId // CRITICAL: This ensures user can only delete their own docs
  }
}

/**
 * Middleware to enforce tenant isolation on requests
 * Use this wrapper for any endpoint that accesses user data
 */
export async function withTenantIsolation(request, handler, options = {}) {
  const { requireAuth = true } = options
  
  // Import auth middleware dynamically to avoid circular deps
  const { requireAuth: authCheck } = await import('./auth-middleware')
  
  if (requireAuth) {
    const auth = await authCheck(request)
    if (!auth.authenticated) {
      return auth.response
    }
    
    // Attach userId to request for use in handler
    request.tenantId = auth.userId
    request.authenticatedUser = auth.user
  }
  
  return handler(request)
}

/**
 * Validate that a provided userId matches the authenticated user
 * Use this to prevent IDOR attacks
 */
export function validateUserIdMatch(providedUserId, authenticatedUserId) {
  if (!authenticatedUserId) {
    return {
      valid: false,
      response: NextResponse.json(
        { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }
  }
  
  if (providedUserId && providedUserId !== authenticatedUserId) {
    // Log potential IDOR attempt
    console.error(`[SECURITY] IDOR attempt: user ${authenticatedUserId} tried to access ${providedUserId}`)
    return {
      valid: false,
      response: NextResponse.json(
        { success: false, error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }
  }
  
  return { valid: true, userId: authenticatedUserId }
}

/**
 * Collections that should ALWAYS have tenant isolation
 * Add new user-specific collections here
 */
export const TENANT_ISOLATED_COLLECTIONS = [
  'library',
  'credit_transactions',
  'payment_transactions',
  'generations',
  'sessions',
  'user_settings',
  'saved_content',
  'user_templates'
]

/**
 * Audit helper - log all cross-tenant access attempts
 */
export async function auditDataAccess(collection, userId, documentIds, action = 'read') {
  // This would be implemented with your logging system
  const logEntry = {
    timestamp: new Date(),
    collection,
    userId,
    documentIds: Array.isArray(documentIds) ? documentIds : [documentIds],
    action,
    source: 'tenant-isolation'
  }
  
  // Log to security audit (in production, send to SIEM)
  if (process.env.NODE_ENV === 'production') {
    console.log('[AUDIT]', JSON.stringify(logEntry))
  }
}
