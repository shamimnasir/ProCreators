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
        action: 'login',
        email: body.email,
        password: body.password
      })
    })
    
    // SECURITY: Pass through Set-Cookie so the session_token cookie reaches the browser
    const headers = new Headers({ 'Content-Type': 'application/json' })
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) headers.append('Set-Cookie', setCookie)

    return new NextResponse(res.body, {
      status: res.status,
      headers
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
