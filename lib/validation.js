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
  content: z.string().max(5000000).optional().nullable(), // 5MB max for content
  type: z.string().min(1).max(50),
  category: z.enum(['video', 'image', 'text', 'document']).optional().nullable(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(), // Fixed for Zod v4
  videoUrl: z.string().max(2000).optional().nullable(), // Accept both full URLs and relative paths
  script: z.string().max(50000).optional().nullable(),
  filePath: z.string().max(1000).optional().nullable(),
  fileSize: z.number().positive().max(500000000).optional().nullable() // 500MB max
})

// ==================== CONTENT GENERATION SCHEMAS ====================

// Common generation options
const languageEnum = z.enum(['en', 'bn', 'hi', 'es', 'fr', 'de', 'pt', 'ar', 'zh', 'ja', 'ko'])
const toneEnum = z.enum(['professional', 'casual', 'formal', 'friendly', 'persuasive', 'informative'])

// Blog generation schema
export const blogGenerateSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500),
  tone: toneEnum.optional().default('professional'),
  language: languageEnum.optional().default('en'),
  wordCount: z.number().int().min(100).max(10000).optional().default(1000),
  keywords: z.array(z.string().max(100)).max(20).optional(),
  includeImages: z.boolean().optional().default(false)
})

// Ebook generation schema
export const ebookGenerateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  outline: z.string().min(1, 'Outline is required').max(5000),
  genre: z.enum(['self-help', 'business', 'fiction', 'non-fiction', 'how-to', 'cookbook', 'health', 'finance']).optional(),
  chapterCount: z.number().int().min(3).max(50).optional().default(10),
  language: languageEnum.optional().default('en'),
  designStyle: z.string().max(50).optional(),
  colorScheme: z.string().max(50).optional(),
  coverStyle: z.string().max(50).optional(),
  authorName: z.string().max(100).optional()
})

// Video generation schema
export const videoGenerateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000),
  duration: z.number().int().min(5).max(300).optional().default(30),
  format: z.enum(['portrait', 'landscape', 'square']).optional().default('portrait'),
  style: z.string().max(50).optional(),
  voiceOption: z.enum(['tts', 'upload', 'none']).optional().default('tts'),
  language: languageEnum.optional().default('en'),
  captionStyle: z.enum(['none', 'bold-outline', 'minimal', 'karaoke']).optional().default('bold-outline')
})

// Image generation schema
export const imageGenerateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000),
  style: z.string().max(100).optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional().default('1:1'),
  count: z.number().int().min(1).max(4).optional().default(1)
})

// Carousel generation schema
export const carouselGenerateSchema = z.object({
  topic: z.string().min(1).max(500),
  slideCount: z.number().int().min(3).max(15).optional().default(8),
  style: z.string().max(50).optional(),
  platform: z.enum(['instagram', 'linkedin', 'twitter']).optional().default('instagram'),
  language: languageEnum.optional().default('en')
})

// Resume generation schema
export const resumeGenerateSchema = z.object({
  personalInfo: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    location: z.string().max(200).optional()
  }),
  experience: z.array(z.object({
    title: z.string().max(200),
    company: z.string().max(200),
    duration: z.string().max(100),
    description: z.string().max(2000).optional()
  })).max(20).optional(),
  education: z.array(z.object({
    degree: z.string().max(200),
    institution: z.string().max(200),
    year: z.string().max(20)
  })).max(10).optional(),
  skills: z.array(z.string().max(100)).max(50).optional(),
  targetRole: z.string().max(200).optional(),
  template: z.string().max(50).optional()
})

// Pitch deck generation schema
export const pitchDeckGenerateSchema = z.object({
  companyName: z.string().min(1).max(200),
  tagline: z.string().max(500).optional(),
  problem: z.string().min(1).max(2000),
  solution: z.string().min(1).max(2000),
  targetMarket: z.string().max(2000).optional(),
  businessModel: z.string().max(2000).optional(),
  traction: z.string().max(2000).optional(),
  team: z.array(z.object({
    name: z.string().max(100),
    role: z.string().max(100)
  })).max(10).optional(),
  funding: z.string().max(1000).optional(),
  template: z.string().max(50).optional()
})

// Quiz generation schema
export const quizGenerateSchema = z.object({
  topic: z.string().min(1).max(500),
  questionCount: z.number().int().min(5).max(100).optional().default(10),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).optional().default('medium'),
  questionTypes: z.array(z.enum(['multiple-choice', 'true-false', 'fill-blank', 'short-answer'])).optional(),
  language: languageEnum.optional().default('en')
})

// Social media post schema
export const socialPostGenerateSchema = z.object({
  topic: z.string().min(1).max(500),
  platform: z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'threads']),
  tone: toneEnum.optional().default('professional'),
  includeHashtags: z.boolean().optional().default(true),
  postCount: z.number().int().min(1).max(10).optional().default(1),
  language: languageEnum.optional().default('en')
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
    // Check if schema is defined
    if (!schema || typeof schema.safeParse !== 'function') {
      console.error('Validation schema is not defined or invalid')
      return { 
        success: false, 
        errors: [{ field: 'schema', message: 'Invalid validation schema' }] 
      }
    }
    
    // Log what we're validating for debugging
    
    const result = schema.safeParse(data)
    
    if (result.success) {
      return { success: true, data: result.data }
    }
    
    // Zod returns issues array in different ways
    const issues = result.error?.issues || result.error?.errors || []
    
    if (Array.isArray(issues) && issues.length > 0) {
      const errors = issues.map(err => ({
        field: err.path && err.path.length > 0 ? err.path.join('.') : 'root',
        message: err.message
      }))
      return { success: false, errors }
    }
    
    // Fallback for different error formats
    return { 
      success: false, 
      errors: [{ field: 'validation', message: 'Invalid input' }] 
    }
  } catch (error) {
    console.error('Zod validation error:', error.message)
    return { 
      success: false, 
      errors: [{ field: 'unknown', message: error.message || 'Validation error' }] 
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
  // Auth schemas
  authSchema,
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  profileUpdateSchema,
  // Business schemas
  blogGenerationSchema,
  businessPlanSchema,
  pitchDeckSchema,
  resumeSchema,
  // Payment schemas
  creditPurchaseSchema,
  subscriptionSchema,
  subscriptionCheckoutSchema,
  stripeCheckoutSchema,
  // Library schemas
  saveToLibrarySchema,
  librarySaveSchema,
  // Security
  csrfTokenSchema,
  adminUserActionSchema,
  // Content generation schemas
  blogGenerateSchema,
  ebookGenerateSchema,
  videoGenerateSchema,
  imageGenerateSchema,
  carouselGenerateSchema,
  resumeGenerateSchema,
  pitchDeckGenerateSchema,
  quizGenerateSchema,
  socialPostGenerateSchema
}
