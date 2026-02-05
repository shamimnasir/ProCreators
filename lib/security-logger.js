// Security Logging and Monitoring Library
// Tracks security-relevant events for audit and monitoring

import { connectToDatabase } from './mongodb'

// Security event types
export const SECURITY_EVENTS = {
  // Authentication events
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  LOGIN_BLOCKED: 'auth.login.blocked',
  LOGOUT: 'auth.logout',
  SIGNUP: 'auth.signup',
  PASSWORD_RESET_REQUEST: 'auth.password.reset_request',
  PASSWORD_RESET_SUCCESS: 'auth.password.reset_success',
  PASSWORD_CHANGE: 'auth.password.change',
  EMAIL_VERIFICATION: 'auth.email.verification',
  
  // Authorization events
  UNAUTHORIZED_ACCESS: 'authz.unauthorized',
  ADMIN_ACCESS: 'authz.admin.access',
  ADMIN_ACTION: 'authz.admin.action',
  
  // Security threats
  RATE_LIMIT_EXCEEDED: 'threat.rate_limit',
  SUSPICIOUS_INPUT: 'threat.suspicious_input',
  CSRF_VIOLATION: 'threat.csrf',
  INJECTION_ATTEMPT: 'threat.injection',
  BRUTE_FORCE: 'threat.brute_force',
  
  // Data access
  SENSITIVE_DATA_ACCESS: 'data.sensitive_access',
  DATA_EXPORT: 'data.export',
  BULK_DATA_REQUEST: 'data.bulk_request',
  
  // System events
  API_ERROR: 'system.api_error',
  DATABASE_ERROR: 'system.db_error',
}

// Severity levels
export const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
}

/**
 * Log a security event
 */
export async function logSecurityEvent(event, data = {}) {
  try {
    const { db } = await connectToDatabase()
    
    const logEntry = {
      _id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      event,
      severity: getSeverity(event),
      timestamp: new Date(),
      data: {
        ...sanitizeLogData(data),
        // Add request metadata if available
        userAgent: data.userAgent || null,
        ip: data.ip || null,
        userId: data.userId || null,
      }
    }
    
    await db.collection('security_logs').insertOne(logEntry)
    
    // If critical, also log to console for immediate alerting
    if (logEntry.severity === SEVERITY.CRITICAL) {
      console.error(`[SECURITY CRITICAL] ${event}:`, JSON.stringify(data))
    }
    
    return logEntry._id
  } catch (error) {
    // Don't let logging failures break the app
    console.error('Security logging error:', error)
    return null
  }
}

/**
 * Get severity level based on event type
 */
function getSeverity(event) {
  if (event.startsWith('threat.')) return SEVERITY.CRITICAL
  if (event.includes('failed') || event.includes('blocked')) return SEVERITY.WARNING
  if (event.includes('error')) return SEVERITY.ERROR
  return SEVERITY.INFO
}

/**
 * Sanitize data before logging (remove sensitive info)
 */
function sanitizeLogData(data) {
  const sanitized = { ...data }
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'passwordHash', 'token', 'sessionToken', 'apiKey', 'secret']
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  })
  
  // Truncate large fields
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
      sanitized[key] = sanitized[key].substring(0, 1000) + '...[TRUNCATED]'
    }
  })
  
  return sanitized
}

/**
 * Log failed authentication attempt with context
 */
export async function logAuthFailure(email, ip, reason, additionalData = {}) {
  return logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
    email: email ? email.substring(0, 3) + '***' : null, // Partial email for privacy
    ip,
    reason,
    ...additionalData
  })
}

/**
 * Log successful authentication
 */
export async function logAuthSuccess(userId, ip) {
  return logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
    userId,
    ip
  })
}

/**
 * Log a security threat
 */
export async function logThreat(threatType, details = {}) {
  return logSecurityEvent(threatType, {
    ...details,
    timestamp: new Date()
  })
}

/**
 * Check for brute force attempts
 */
export async function checkBruteForce(identifier, window = 15 * 60 * 1000) {
  try {
    const { db } = await connectToDatabase()
    
    const since = new Date(Date.now() - window)
    const failedAttempts = await db.collection('security_logs').countDocuments({
      event: SECURITY_EVENTS.LOGIN_FAILED,
      timestamp: { $gte: since },
      $or: [
        { 'data.ip': identifier },
        { 'data.email': identifier }
      ]
    })
    
    // Threshold for brute force detection
    if (failedAttempts >= 5) {
      await logSecurityEvent(SECURITY_EVENTS.BRUTE_FORCE, {
        identifier: identifier.substring(0, 5) + '***',
        attemptCount: failedAttempts,
        window: `${window / 60000} minutes`
      })
      return { blocked: true, attempts: failedAttempts }
    }
    
    return { blocked: false, attempts: failedAttempts }
  } catch (error) {
    console.error('Brute force check error:', error)
    return { blocked: false, attempts: 0 }
  }
}

/**
 * Get security logs for admin dashboard
 */
export async function getSecurityLogs(options = {}) {
  try {
    const { db } = await connectToDatabase()
    
    const {
      limit = 100,
      severity = null,
      event = null,
      since = null,
      userId = null
    } = options
    
    const query = {}
    if (severity) query.severity = severity
    if (event) query.event = { $regex: event, $options: 'i' }
    if (since) query.timestamp = { $gte: new Date(since) }
    if (userId) query['data.userId'] = userId
    
    const logs = await db.collection('security_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
    
    return logs
  } catch (error) {
    console.error('Get security logs error:', error)
    return []
  }
}

/**
 * Get security statistics for dashboard
 */
export async function getSecurityStats(hours = 24) {
  try {
    const { db } = await connectToDatabase()
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    const stats = await db.collection('security_logs').aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]).toArray()
    
    const eventCounts = await db.collection('security_logs').aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray()
    
    return {
      bySeverity: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      topEvents: eventCounts,
      period: `${hours} hours`
    }
  } catch (error) {
    console.error('Get security stats error:', error)
    return { bySeverity: {}, topEvents: [], period: `${hours} hours` }
  }
}

export default {
  logSecurityEvent,
  logAuthFailure,
  logAuthSuccess,
  logThreat,
  checkBruteForce,
  getSecurityLogs,
  getSecurityStats,
  SECURITY_EVENTS,
  SEVERITY
}
