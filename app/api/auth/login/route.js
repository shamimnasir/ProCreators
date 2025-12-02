import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured. Add credentials to .env' },
        { status: 500 }
      )
    }

    // TODO: Implement Supabase auth
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email,
    //   password,
    // })

    return NextResponse.json({
      success: true,
      message: 'Login placeholder - Supabase integration pending'
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
