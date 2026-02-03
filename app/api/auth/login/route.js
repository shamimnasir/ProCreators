// Redirect to main auth API
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Forward to main auth API
    const res = await fetch(new URL('/api/auth', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: body.email,
        password: body.password
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
