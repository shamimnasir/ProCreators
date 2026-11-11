// Email Service using Mailgun
import Mailgun from 'mailgun.js'
import formData from 'form-data'

// Lazy client: mailgun.js throws at construction when the key is missing,
// which would crash any route importing this module at build time.
let _mg = null
function getClient() {
  if (!_mg) {
    if (!process.env.MAILGUN_API_KEY) {
      throw new Error('MAILGUN_API_KEY is not set')
    }
    _mg = new Mailgun(formData).client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY
    })
  }
  return _mg
}

const DOMAIN = process.env.MAILGUN_DOMAIN || 'sandbox.mailgun.org'
const FROM_EMAIL = process.env.FROM_EMAIL || `ProCreators <noreply@${DOMAIN}>`

export async function sendVerificationEmail(email, token, baseUrl) {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`
  
  try {
    const result = await getClient().messages.create(DOMAIN, {
      'o:tracking-clicks': 'no',
      from: FROM_EMAIL,
      to: [email],
      subject: 'Verify your ProCreators account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🚀 ProCreators</div>
            <h1>Verify your email</h1>
            <p>Welcome to ProCreators! Please verify your email address to get started with AI-powered content creation.</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p style="color: #666; font-size: 14px;">Or copy this link: ${verificationUrl}</p>
            <p>This link expires in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create an account with ProCreators, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })
    
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendPasswordResetEmail(email, token, baseUrl) {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`
  
  try {
    const result = await getClient().messages.create(DOMAIN, {
      'o:tracking-clicks': 'no',
      from: FROM_EMAIL,
      to: [email],
      subject: 'Reset your ProCreators password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🚀 ProCreators</div>
            <h1>Reset your password</h1>
            <p>We received a request to reset your password. Click the button below to choose a new password.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p style="color: #666; font-size: 14px;">Or copy this link: ${resetUrl}</p>
            <p>This link expires in 1 hour.</p>
            <div class="footer">
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })
    
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendWelcomeEmail(email, name, baseUrl) {
  try {
    const result = await getClient().messages.create(DOMAIN, {
      'o:tracking-clicks': 'no',
      from: FROM_EMAIL,
      to: [email],
      subject: 'Welcome to ProCreators! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .credits { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🚀 ProCreators</div>
            <h1>Welcome, ${name || 'Creator'}! 🎉</h1>
            <p>Your account is now verified and ready to use. Start creating amazing content with AI!</p>
            <div class="credits">
              <strong>🎁 You've received 25 free credits!</strong>
              <p style="margin: 10px 0 0 0;">Use them to explore our AI tools and create your first content.</p>
            </div>
            <a href="${baseUrl}/dashboard" class="button">Start Creating</a>
            <h3>What can you create?</h3>
            <ul>
              <li>📝 Blog posts, articles, and social media content</li>
              <li>📚 eBooks, planners, and digital products</li>
              <li>🎬 Videos, reels, and multimedia content</li>
              <li>🎨 Images, thumbnails, and graphics</li>
            </ul>
            <div class="footer">
              <p>Need help? Reply to this email or visit our support center.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })
    
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendCreditPurchaseEmail(email, name, credits, amount) {
  try {
    const result = await getClient().messages.create(DOMAIN, {
      'o:tracking-clicks': 'no',
      from: FROM_EMAIL,
      to: [email],
      subject: `Receipt: ${credits} credits added to your account`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 30px; }
            .receipt { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🚀 ProCreators</div>
            <h1>Thank you for your purchase!</h1>
            <p>Hi ${name || 'there'}, your credits have been added to your account.</p>
            <div class="receipt">
              <h3 style="margin-top: 0;">Receipt</h3>
              <p><strong>Credits:</strong> ${credits}</p>
              <p><strong>Amount:</strong> $${amount}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>Your new credits are ready to use. Start creating!</p>
            <div class="footer">
              <p>This is your receipt for the transaction. Keep it for your records.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })
    
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}
