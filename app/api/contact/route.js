// Contact Form API - Sends email via Resend
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Destination email (admin/support email)
    const contactEmail = process.env.CONTACT_EMAIL || 'support@procreators.io'

    // Send email to admin
    const { data, error } = await resend.emails.send({
      from: 'ProCreators <support@procreators.io>',
      to: [contactEmail],
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 100px;">From:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <a href="mailto:${email}" style="color: #667eea;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Subject:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${subject}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Message:</h3>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
          
          <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 14px;">
              This email was sent from the ProCreators contact form.
            </p>
            <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">
              Reply directly to this email to respond to ${name}.
            </p>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to send email. Please try again.' },
        { status: 500 }
      )
    }

    // Send auto-reply to the user
    await resend.emails.send({
      from: 'ProCreators <support@procreators.io>',
      to: [email],
      subject: 'Thanks for contacting ProCreators!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Thanks for reaching out! 🎉</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hi ${name},</p>
            
            <p>Thank you for contacting ProCreators! We've received your message and our team will get back to you within 24 hours.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #374151;">Your message:</p>
              <p style="margin: 10px 0 0 0; color: #6b7280;">"${subject}"</p>
            </div>
            
            <p>In the meantime, feel free to explore our resources:</p>
            <ul style="padding-left: 20px; color: #6b7280;">
              <li><a href="https://procreators.io/docs" style="color: #667eea;">Documentation</a> - Step-by-step guides</li>
              <li><a href="https://procreators.io/faq" style="color: #667eea;">FAQ</a> - Common questions answered</li>
              <li><a href="https://procreators.io/tools" style="color: #667eea;">All Tools</a> - Explore 60+ AI tools</li>
            </ul>
            
            <p style="margin-top: 20px;">Best regards,<br><strong>The ProCreators Team</strong></p>
          </div>
          
          <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 14px;">
              ProCreators - AI-Powered Content Creation Platform
            </p>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px;">
              <a href="https://procreators.io" style="color: #667eea;">Website</a> • 
              <a href="https://procreators.io/tools" style="color: #667eea;">Tools</a> • 
              <a href="https://procreators.io/pricing" style="color: #667eea;">Pricing</a>
            </p>
          </div>
        </body>
        </html>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully!',
      emailId: data?.id
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
