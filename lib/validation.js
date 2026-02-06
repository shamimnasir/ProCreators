// API Validation Schemas using Zod
// Provides type-safe validation for all API inputs

import { z } from 'zod'

// Common field validators
const emailSchema = z.string()
  .email('Invalid email address')
  .max(254, 'Email too long')
  .transform(val => val.toLowerCase().trim())

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .refine(val => /[a-zA-Z]/.test(val), 'Password must contain at least one letter')
  .refine(val => /[0-9]/.test(val), 'Password must contain at least one number')

const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .transform(val => val.trim())

const uuidSchema = z.string()
  .uuid('Invalid ID format')

const stringId = z.string()
  .min(1, 'ID is required')
  .max(100, 'ID too long')

// Authentication schemas
export const loginSchema = z.object({
  action: z.literal('login'),
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

export const signupSchema = z.object({
  action: z.literal('signup'),
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional()
})

export const forgotPasswordSchema = z.object({
  action: z.literal('forgot_password'),
  email: emailSchema
})

export const resetPasswordSchema = z.object({
  action: z.literal('reset_password'),
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordSchema
})

export const verifyEmailSchema = z.object({
  action: z.literal('verify'),
  token: z.string().min(1, 'Token is required')
})

export const resendVerificationSchema = z.object({
  action: z.literal('resend_verification'),
  email: emailSchema
})

// Combined auth schema
export const authSchema = z.discriminatedUnion('action', [
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema
])

// User profile schemas
export const updateProfileSchema = z.object({
  userId: stringId,
  name: nameSchema.optional(),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal(''))
})

// Content generation schemas
export const baseGenerationSchema = z.object({
  userId: stringId.optional(),
  topic: z.string().min(1).max(500, 'Topic too long').optional(),
  prompt: z.string().min(1).max(10000, 'Prompt too long').optional(),
  style: z.string().max(100).optional(),
  tone: z.string().max(100).optional(),
  language: z.string().max(50).default('English'),
  length: z.enum(['short', 'medium', 'long']).optional()
})

export const blogGenerationSchema = baseGenerationSchema.extend({
  title: z.string().min(1).max(500).optional(),
  keywords: z.array(z.string().max(50)).max(10).optional(),
  targetAudience: z.string().max(200).optional()
})

export const businessPlanSchema = z.object({
  userId: stringId.optional(),
  businessName: z.string().min(1).max(200),
  industry: z.string().min(1).max(100),
  businessType: z.string().max(100).optional(),
  targetMarket: z.string().max(500).optional(),
  businessModel: z.string().max(500).optional(),
  fundingNeeds: z.string().max(200).optional(),
  timeline: z.string().max(100).optional()
})

export const pitchDeckSchema = z.object({
  userId: stringId.optional(),
  companyName: z.string().min(1).max(200),
  industry: z.string().min(1).max(100),
  problem: z.string().max(1000).optional(),
  solution: z.string().max(1000).optional(),
  targetMarket: z.string().max(500).optional(),
  businessModel: z.string().max(500).optional(),
  fundingAsk: z.string().max(200).optional()
})

export const resumeSchema = z.object({
  userId: stringId.optional(),
  name: nameSchema,
  email: emailSchema,
  phone: z.string().max(20).optional(),
  summary: z.string().max(1000).optional(),
  experience: z.array(z.object({
    title: z.string().max(200),
    company: z.string().max(200),
    duration: z.string().max(100),
    description: z.string().max(2000).optional()
  })).max(20).optional(),
  education: z.array(z.object({
    degree: z.string().max(200),
    school: z.string().max(200),
    year: z.string().max(20)
  })).max(10).optional(),
  skills: z.array(z.string().max(100)).max(50).optional()
})

// Payment schemas
export const creditPurchaseSchema = z.object({
  userId: stringId,
  packageId: z.enum(['starter', 'creator', 'pro', 'business']),
  originUrl: z.string().url().optional()
})

export const subscriptionSchema = z.object({
  planId: z.enum(['free', 'creator', 'pro', 'business']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  originUrl: z.string().url().optional()
})

// Library schemas
export const saveToLibrarySchema = z.object({
  userId: stringId,
  toolId: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  content: z.any(), // Content can vary by tool
  metadata: z.record(z.any()).optional()
})

// Admin schemas
export const adminUserActionSchema = z.object({
  userId: stringId,
  action: z.enum(['suspend', 'activate', 'delete', 'makeAdmin', 'removeAdmin']),
  reason: z.string().max(500).optional()
})

// Profile update schema
export const profileUpdateSchema = z.object({
  userId: stringId,
  name: z.string().min(1).max(100).transform(val => val.trim()).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').max(2000).optional().or(z.literal(''))
})

// Stripe checkout schema
export const stripeCheckoutSchema = z.object({
  packageId: z.enum(['starter', 'creator', 'pro', 'business'], {
    errorMap: () => ({ message: 'Invalid package. Must be one of: starter, creator, pro, business' })
  }),
  userId: stringId,
  originUrl: z.string().url('Invalid origin URL').max(500)
})

// Subscription checkout schema
export const subscriptionCheckoutSchema = z.object({
  planId: z.enum(['creator', 'pro', 'business'], {
    errorMap: () => ({ message: 'Invalid plan. Must be one of: creator, pro, business' })
  }),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  originUrl: z.string().url('Invalid origin URL').max(500)
})

// Library save schema
export const librarySaveSchema = z.object({
  userId: stringId.optional(),
  content: z.string().max(5000000).optional(), // 5MB max for content
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  metadata: z.record(z.any()).optional(),
  videoUrl: z.string().url().max(2000).optional(),
  script: z.string().max(50000).optional(),
  filePath: z.string().max(1000).optional(),
  fileSize: z.number().positive().max(500000000).optional() // 500MB max
})

// CSRF Token schema
export const csrfTokenSchema = z.object({
  csrfToken: z.string().min(1, 'CSRF token is required')
})

/**
 * Validate request body with a schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateRequest(schema, data) {
  try {
    const result = schema.safeParse(data)
    
    if (result.success) {
      return { success: true, data: result.data }
    }
    
    // Format errors nicely
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
    
    return { success: false, errors }
  } catch (error) {
    return { 
      success: false, 
      errors: [{ field: 'unknown', message: 'Validation error' }] 
    }
  }
}

/**
 * Create a validated API handler
 * Wraps handler with automatic validation
 */
export function withValidation(schema, handler) {
  return async (request) => {
    try {
      const body = await request.json()
      const validation = validateRequest(schema, body)
      
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          errors: validation.errors
        }, { status: 400 })
      }
      
      // Attach validated data to request
      request.validatedBody = validation.data
      return handler(request)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body'
      }, { status: 400 })
    }
  }
}

export default {
  validateRequest,
  withValidation,
  authSchema,
  loginSchema,
  signupSchema,
  updateProfileSchema,
  profileUpdateSchema,
  blogGenerationSchema,
  businessPlanSchema,
  pitchDeckSchema,
  resumeSchema,
  creditPurchaseSchema,
  subscriptionSchema,
  subscriptionCheckoutSchema,
  saveToLibrarySchema,
  librarySaveSchema,
  stripeCheckoutSchema,
  csrfTokenSchema
}
