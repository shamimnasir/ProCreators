// Redirect to main auth API
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Forward to main auth API
    const res = await fetch(new URL('/api/auth', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Preserve the caller's IP so the downstream rate limiter does not see the server itself
        ...(request.headers.get('x-forwarded-for') && { 'x-forwarded-for': request.headers.get('x-forwarded-for') }),
        ...(request.headers.get('x-real-ip') && { 'x-real-ip': request.headers.get('x-real-ip') }),
        ...(request.headers.get('cf-connecting-ip') && { 'cf-connecting-ip': request.headers.get('cf-connecting-ip') }),
      },
      body: JSON.stringify({
        action: 'signup',
        email: body.email,
        password: body.password,
        name: body.name
      })
    })
    
    return new NextResponse(res.body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
